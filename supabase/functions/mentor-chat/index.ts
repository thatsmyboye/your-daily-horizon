import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { aiMonitoring } from "../_shared/ai-monitoring.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000)
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  functionCall: z.object({
    name: z.string(),
    args: z.record(z.any())
  }).optional()
});

const functionCallSchema = z.object({
  functionCall: z.object({
    name: z.string(),
    args: z.record(z.any())
  })
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    
    // Initialize monitoring
    const requestId = aiMonitoring.generateRequestId();
    const startTime = Date.now();
    let tokensIn = 0;
    let tokensOut = 0;
    let success = false;
    let errorType: string | undefined;
    let errorMessage: string | undefined;
    
    // Parse and validate request body
    const body = await req.json();
    
    // Determine if this is a function call or chat request
    let messages: typeof messageSchema._output[] | undefined;
    let functionCall;
    
    if (body.functionCall && !body.messages) {
      // Function call only
      const validated = functionCallSchema.parse(body);
      functionCall = validated.functionCall;
    } else {
      // Chat request
      const validated = chatRequestSchema.parse(body);
      messages = validated.messages;
      functionCall = validated.functionCall;
    }

    console.log("Mentor chat request:", { userId, messagesCount: messages?.length, functionCall: !!functionCall });

    // Handle function calls
    if (functionCall) {
      if (functionCall.name === 'saveMentorNote') {
        const { text, tags } = functionCall.args;
        const { error } = await supabaseClient
          .from('mentor_notes')
          .insert([{
            user_id: userId,
            note: text,
            tags: tags || [],
          }]);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: 'Note saved successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (functionCall.name === 'suggestMicroHabits') {
        const { missionId } = functionCall.args;
        
        // Get mission details
        const { data: mission, error: missionError } = await supabaseClient
          .from('missions')
          .select('*')
          .eq('id', missionId)
          .single();

        if (missionError) throw missionError;

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'user',
              content: `For the mission "${mission.title}" (${mission.type}, ${mission.cadence}), suggest 3 quick micro-habits (5-15 min each) the user can do today. Be specific and actionable.`
            }],
            tools: [{
              type: 'function',
              function: {
                name: 'suggest_micro_habits',
                description: 'Suggest 3 micro-habits for a mission',
                parameters: {
                  type: 'object',
                  properties: {
                    habits: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 3,
                      maxItems: 3
                    }
                  },
                  required: ['habits']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'suggest_micro_habits' } }
          }),
        });

        if (!response.ok) throw new Error('AI request failed');

        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        const habits = JSON.parse(toolCall.function.arguments).habits;

        return new Response(
          JSON.stringify({ habits }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build context for chat
    const today = new Date().toISOString().split('T')[0];

    // Get today's entry
    const { data: todayEntry } = await supabaseClient
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    // Get last 7 days entries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentEntries } = await supabaseClient
      .from('daily_entries')
      .select('date, mood, reflections, ai_suggestion')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(7);

    // Get active missions
    const { data: missions } = await supabaseClient
      .from('missions')
      .select('id, title, type, cadence, xp, level, target_per_week')
      .eq('user_id', userId)
      .eq('active', true);

    // Get last 10 mentor notes
    const { data: mentorNotes } = await supabaseClient
      .from('mentor_notes')
      .select('note, tags, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build context string
    let context = "# User Context\n\n";

    if (todayEntry) {
      context += `## Today (${today})\n`;
      context += `Mood: ${todayEntry.mood}/5\n`;
      if (todayEntry.reflections) context += `Reflections: "${todayEntry.reflections}"\n`;
      if (todayEntry.ai_suggestion) context += `Suggestion given: "${todayEntry.ai_suggestion}"\n`;
      context += "\n";
    }

    if (recentEntries && recentEntries.length > 0) {
      context += "## Recent Week\n";
      recentEntries.forEach(entry => {
        context += `- ${entry.date}: Mood ${entry.mood}/5`;
        if (entry.ai_suggestion) context += ` | "${entry.ai_suggestion}"`;
        context += "\n";
      });
      context += "\n";
    }

    if (missions && missions.length > 0) {
      context += "## Active Missions\n";
      missions.forEach(m => {
        context += `- ${m.title} (${m.type}, ${m.cadence}) - Level ${m.level}, ${m.xp} XP, Target: ${m.target_per_week}/week\n`;
      });
      context += "\n";
    }

    if (mentorNotes && mentorNotes.length > 0) {
      context += "## Recent Notes\n";
      mentorNotes.slice(0, 5).forEach(note => {
        context += `- "${note.note}"`;
        if (note.tags && note.tags.length > 0) context += ` [${note.tags.join(', ')}]`;
        context += "\n";
      });
      context += "\n";
    }

    console.log("Context built:", context.substring(0, 500) + "...");

    // Calculate input tokens for monitoring
    const inputText = systemPrompt + (messages || []).map(m => m.content).join(' ');
    tokensIn = aiMonitoring.estimateTokens(inputText);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are Horizon, the user's AI life mentor. Your personality:
- Supportive yet pragmatic
- Concise and direct (no fluff)
- Evidence-based (reference their actual data)
- Motivational with actionable advice
- Always end with a small, specific nudge they can act on today

${context}

Keep responses brief (2-4 sentences max). Focus on what they can do RIGHT NOW.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || [])
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'saveMentorNote',
              description: 'Save an important insight or reminder about the user',
              parameters: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'The note content' },
                  tags: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Optional tags like "goal", "insight", "reminder"'
                  }
                },
                required: ['text']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'suggestMicroHabits',
              description: 'Suggest quick actionable habits for a specific mission',
              parameters: {
                type: 'object',
                properties: {
                  missionId: { type: 'string', description: 'The mission ID' }
                },
                required: ['missionId']
              }
            }
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    console.log("AI response:", message);

    // Calculate output tokens for monitoring
    const outputText = message.content || '';
    tokensOut = aiMonitoring.estimateTokens(outputText);
    success = true;

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      console.log("Tool call requested:", toolCall.function.name);
      
      return new Response(
        JSON.stringify({
          requiresAction: true,
          toolCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track successful completion
    await aiMonitoring.trackMetric({
      functionName: 'mentor-chat',
      userId,
      requestId,
      startTime,
      endTime: Date.now(),
      tokensIn,
      tokensOut,
      success: true,
      contextSize: context.length,
    });

    return new Response(
      JSON.stringify({ message: message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in mentor-chat:', error);
    
    // Track error
    errorType = error.name || 'unknown_error';
    errorMessage = error.message || 'Unknown error';
    success = false;
    
    await aiMonitoring.trackMetric({
      functionName: 'mentor-chat',
      userId: userId || 'unknown',
      requestId: requestId || aiMonitoring.generateRequestId(),
      startTime,
      endTime: Date.now(),
      tokensIn,
      tokensOut,
      success: false,
      errorType,
      errorMessage,
      contextSize: 0,
    });
    
    // Handle validation errors separately
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
