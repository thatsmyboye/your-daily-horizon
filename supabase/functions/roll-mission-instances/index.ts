import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { cadence } = await req.json();

    // Calculate period_id based on cadence
    const now = new Date();
    let periodId: string;
    
    switch (cadence) {
      case 'daily':
        periodId = now.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        const year = now.getFullYear();
        const oneJan = new Date(year, 0, 1);
        const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / 86400000);
        const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
        periodId = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
        break;
      case 'monthly':
        periodId = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'seasonal':
        const month = now.getMonth();
        const season = Math.floor(month / 3);
        periodId = `${now.getFullYear()}-Q${season + 1}`;
        break;
      default:
        periodId = now.toISOString().split('T')[0];
    }

    console.log(`Rolling instances for ${cadence} - period: ${periodId}`);

    // Get active missions for this cadence
    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('id')
      .eq('cadence', cadence)
      .eq('active', true);

    if (missionsError) throw missionsError;

    // Check existing instances
    const { data: existing } = await supabase
      .from('mission_instances')
      .select('mission_id')
      .eq('user_id', user.id)
      .eq('period_id', periodId);

    const existingMissionIds = new Set(existing?.map(e => e.mission_id) || []);

    // Create missing instances (up to 5 per cadence)
    const toCreate = missions
      .filter(m => !existingMissionIds.has(m.id))
      .slice(0, 5 - (existing?.length || 0))
      .map(m => ({
        mission_id: m.id,
        user_id: user.id,
        period_id: periodId,
        status: 'available'
      }));

    if (toCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('mission_instances')
        .insert(toCreate);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      console.log(`Created ${toCreate.length} new instances`);
    }

    return new Response(JSON.stringify({ success: true, created: toCreate.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error rolling instances:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
