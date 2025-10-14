import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const generatePulseSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const { userId, date } = generatePulseSchema.parse(body);

    console.log("Generate daily pulse request:", { userId, date });

    // Initialize Supabase client with service role for reading user data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's active missions
    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (missionsError) {
      console.error('Error fetching missions:', missionsError);
      throw missionsError;
    }

    // Fetch last 7 days of entries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      throw entriesError;
    }

    console.log("Fetched data:", { 
      missionsCount: missions?.length || 0, 
      recentEntriesCount: recentEntries?.length || 0 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context for AI
    const missionsSummary = missions?.map(m => 
      `${m.title} (${m.type}, ${m.cadence})`
    ).join(', ') || 'No active missions';

    const recentReflections = recentEntries?.slice(0, 3).map(e => 
      `${e.date}: Mood ${e.mood}/5${e.reflections ? `, "${e.reflections.substring(0, 100)}..."` : ''}`
    ).join('\n') || 'No recent entries';

    const systemPrompt = `You are Horizon, an AI life mentor. You are supportive, concise, pragmatic, and bias toward smallest-viable actions. You ground suggestions in the user's missions, cadence, and recent mood trends. Limit output to useful, specific steps. Avoid therapy claims.

Today's date: ${date}

User's active missions: ${missionsSummary}

Recent entries:
${recentReflections}

Generate:
1. A reflective prompt that encourages self-awareness and ties to their current missions
2. One realistic, specific micro-habit for today that supports one of their missions

Make it personal and actionable for their day.`;

    const userPrompt = `Create today's daily pulse for this user.`;

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
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_daily_pulse',
            description: 'Generate daily reflection prompt and micro-habit suggestion',
            parameters: {
              type: 'object',
              properties: {
                ai_prompt: { 
                  type: 'string', 
                  description: 'A thoughtful reflective question or prompt for the user (1-2 sentences)' 
                },
                ai_suggestion: { 
                  type: 'string', 
                  description: 'A specific, actionable micro-habit for today (1 sentence, 5-15 min activity)' 
                }
              },
              required: ['ai_prompt', 'ai_suggestion']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_daily_pulse' } }
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
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract pulse data from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_daily_pulse') {
      throw new Error('Invalid AI response format');
    }

    const pulseData = JSON.parse(toolCall.function.arguments);

    console.log("Generated pulse:", pulseData);

    return new Response(
      JSON.stringify(pulseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-daily-pulse:', error);
    
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
