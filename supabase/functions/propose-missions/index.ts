import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { focusAreas, whyNow, minutesPerDay, daysPerWeek, coachTone } = await req.json();

    console.log("Propose missions request:", { focusAreas, whyNow, minutesPerDay, daysPerWeek, coachTone });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are Horizon, an AI life mentor. You are supportive, concise, pragmatic, and bias toward smallest-viable actions. You ground suggestions in the user's missions, cadence, and recent mood trends. Limit output to useful, specific steps. Avoid therapy claims.

Based on their chosen focus areas, intent, available time, and preferred coaching tone, propose 3 specific, actionable missions.

Guidelines:
- Each mission should be concrete and measurable
- Match the user's coach tone: ${coachTone}
- Consider their time constraint (${minutesPerDay} minutes/day)
- Align with their intent: ${whyNow}
- Focus areas: ${focusAreas.join(', ')}

Return missions that feel personal and achievable.`;

    const userPrompt = `Create 3 missions for someone who:
- Wants to focus on: ${focusAreas.join(', ')}
- Their why: ${whyNow}
- Has ${minutesPerDay} minutes per day
- Available days: ${daysPerWeek.join(', ')}
- Prefers ${coachTone} coaching tone

For each mission, provide:
1. A clear, actionable title
2. The mission type (one of: ${focusAreas.join(', ')})
3. Recommended cadence (e.g., "daily", "3x/week", "weekdays")
4. Target completions per week (1-7)
5. A compelling one-sentence intent explaining why this mission matters`;

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
            name: 'propose_missions',
            description: 'Propose 3 personalized missions for the user',
            parameters: {
              type: 'object',
              properties: {
                missions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Clear, actionable mission title' },
                      type: { 
                        type: 'string', 
                        enum: ['Mind', 'Body', 'Craft', 'Relationships', 'Finance', 'Spirit', 'Custom'],
                        description: 'Mission category' 
                      },
                      cadence: { type: 'string', description: 'How often (e.g., daily, 3x/week)' },
                      target_per_week: { 
                        type: 'integer', 
                        description: 'Number of times per week (1-7)',
                        minimum: 1,
                        maximum: 7
                      },
                      intent: { type: 'string', description: 'One-sentence explaining why this mission matters' }
                    },
                    required: ['title', 'type', 'cadence', 'target_per_week', 'intent']
                  },
                  minItems: 3,
                  maxItems: 3
                }
              },
              required: ['missions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'propose_missions' } }
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

    // Extract missions from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'propose_missions') {
      throw new Error('Invalid AI response format');
    }

    const missionsData = JSON.parse(toolCall.function.arguments);
    const missions = missionsData.missions;

    console.log("Proposed missions:", missions);

    return new Response(
      JSON.stringify({ missions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in propose-missions:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
