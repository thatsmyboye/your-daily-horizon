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

    const { instance_id } = await req.json();

    // Get the mission instance
    const { data: instance, error: instanceError } = await supabase
      .from('mission_instances')
      .select(`
        id,
        status,
        user_id,
        period_id,
        missions (
          id,
          xp,
          coins,
          cadence
        )
      `)
      .eq('id', instance_id)
      .eq('user_id', user.id)
      .single();

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: 'Mission not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (instance.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Mission not completed yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update instance to claimed
    const { error: updateError } = await supabase
      .from('mission_instances')
      .update({ status: 'claimed' })
      .eq('id', instance_id);

    if (updateError) throw updateError;

    // Record completion
    const { error: completionError } = await supabase
      .from('mission_completions')
      .insert({
        mission_instance_id: instance_id,
        user_id: user.id,
        xp_awarded: instance.missions.xp,
        coins_awarded: instance.missions.coins
      });

    if (completionError) throw completionError;

    // Initialize or update user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const today = new Date().toISOString().split('T')[0];
    let streakUpdate = {};

    if (instance.missions.cadence === 'daily') {
      const lastDaily = stats?.last_daily_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (!lastDaily) {
        streakUpdate = { daily_streak: 1, last_daily_date: today };
      } else if (lastDaily === yesterdayStr) {
        streakUpdate = { daily_streak: (stats.daily_streak || 0) + 1, last_daily_date: today };
      } else if (lastDaily !== today) {
        streakUpdate = { daily_streak: 1, last_daily_date: today };
      }
    }

    if (stats) {
      const { error: statsError } = await supabase
        .from('user_stats')
        .update({
          xp_total: (stats.xp_total || 0) + instance.missions.xp,
          coins_total: (stats.coins_total || 0) + instance.missions.coins,
          ...streakUpdate
        })
        .eq('user_id', user.id);

      if (statsError) throw statsError;
    } else {
      const { error: insertStatsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: user.id,
          xp_total: instance.missions.xp,
          coins_total: instance.missions.coins,
          ...streakUpdate
        });

      if (insertStatsError) throw insertStatsError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error claiming rewards:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
