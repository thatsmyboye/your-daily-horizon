import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Disable in production
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";
  if (isProduction) {
    return new Response(
      JSON.stringify({ error: "This endpoint is disabled in production" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete existing demo data for this user
    await supabaseClient.from("checkins").delete().eq("user_id", user.id);
    await supabaseClient.from("mentor_notes").delete().eq("user_id", user.id);
    await supabaseClient.from("daily_entries").delete().eq("user_id", user.id);
    await supabaseClient.from("missions").delete().eq("user_id", user.id);

    // Seed 3 missions
    const { data: missions, error: missionsError } = await supabaseClient
      .from("missions")
      .insert([
        {
          user_id: user.id,
          title: "Morning Meditation",
          type: "Mind",
          intent: "Build a consistent mindfulness practice",
          cadence: "daily",
          target_per_week: 7,
          xp: 150,
          level: 2,
          active: true,
        },
        {
          user_id: user.id,
          title: "Exercise Routine",
          type: "Body",
          intent: "Stay physically active and healthy",
          cadence: "3x per week",
          target_per_week: 3,
          xp: 80,
          level: 1,
          active: true,
        },
        {
          user_id: user.id,
          title: "Creative Writing",
          type: "Craft",
          intent: "Develop writing skills and express creativity",
          cadence: "weekly",
          target_per_week: 5,
          xp: 220,
          level: 3,
          active: true,
        },
      ])
      .select();

    if (missionsError) throw missionsError;

    // Seed 10 days of daily entries
    const dailyEntries = [];
    const today = new Date();
    const moods = [3, 4, 5, 3, 4, 2, 4, 5, 3, 4];
    const reflections = [
      "Had a productive day today. Feeling motivated.",
      "Struggled a bit with focus but pushed through.",
      "Great day! Everything clicked into place.",
      "Feeling a bit overwhelmed but staying positive.",
      "Made good progress on my goals today.",
      "Had some challenges but learned from them.",
      "Feeling energized and ready for more.",
      "A calm and peaceful day overall.",
      "Busy day but managed to stay on track.",
      "Ending the day with gratitude.",
    ];

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dailyEntries.push({
        user_id: user.id,
        date: date.toISOString().split("T")[0],
        mood: moods[i],
        reflections: reflections[i],
        completed: true,
        ai_prompt: "What small win can you celebrate from today?",
        ai_suggestion: "Take 5 minutes to journal about your progress",
      });
    }

    const { error: entriesError } = await supabaseClient
      .from("daily_entries")
      .insert(dailyEntries);

    if (entriesError) throw entriesError;

    // Seed 20 check-ins across missions
    const checkIns = [];
    for (let i = 0; i < 20; i++) {
      const mission = missions[i % 3];
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(i / 3));

      checkIns.push({
        user_id: user.id,
        mission_id: mission.id,
        occurred_at: date.toISOString(),
        xp_awarded: 10,
      });
    }

    const { error: checkInsError } = await supabaseClient
      .from("checkins")
      .insert(checkIns);

    if (checkInsError) throw checkInsError;

    // Seed 5 mentor notes
    const mentorNotes = [
      {
        user_id: user.id,
        note: "User expressed interest in improving morning routine consistency",
        tags: ["habits", "morning"],
      },
      {
        user_id: user.id,
        note: "Mentioned challenges with maintaining exercise motivation during busy periods",
        tags: ["exercise", "motivation"],
      },
      {
        user_id: user.id,
        note: "Wants to develop a creative writing practice, interested in journaling techniques",
        tags: ["writing", "creativity"],
      },
      {
        user_id: user.id,
        note: "Appreciates accountability check-ins and progress tracking features",
        tags: ["feedback", "features"],
      },
      {
        user_id: user.id,
        note: "Asked about strategies for dealing with perfectionism",
        tags: ["mindset", "growth"],
      },
    ];

    const { error: notesError } = await supabaseClient
      .from("mentor_notes")
      .insert(mentorNotes);

    if (notesError) throw notesError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo data seeded successfully",
        data: {
          missions: missions.length,
          dailyEntries: dailyEntries.length,
          checkIns: checkIns.length,
          mentorNotes: mentorNotes.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Failed to seed demo data" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
