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

  try {
    const { userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, badges")
      .eq("id", userId)
      .single();

    const displayName = profile?.display_name || "Horizon User";

    // Calculate streak
    const { data: entries } = await supabase
      .from("daily_entries")
      .select("date, completed")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("date", { ascending: false })
      .limit(100);

    let streak = 0;
    if (entries && entries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < entries.length; i++) {
        const entryDate = new Date(entries[i].date);
        entryDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Get top mission this week (most check-ins in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: checkIns } = await supabase
      .from("checkins")
      .select("mission_id, missions(title)")
      .eq("user_id", userId)
      .gte("occurred_at", sevenDaysAgo.toISOString());

    let topMission = "No active missions";
    let completions = 0;

    if (checkIns && checkIns.length > 0) {
      const missionCounts: Record<string, { title: string; count: number }> = {};
      
      checkIns.forEach((ci: any) => {
        const missionId = ci.mission_id;
        const title = ci.missions?.title || "Unknown";
        
        if (!missionCounts[missionId]) {
          missionCounts[missionId] = { title, count: 0 };
        }
        missionCounts[missionId].count++;
      });

      const topEntry = Object.values(missionCounts).sort((a, b) => b.count - a.count)[0];
      topMission = topEntry.title;
      completions = topEntry.count;
    }

    // Generate short mentor line using AI
    const mentorPrompt = `Generate a short, motivational message (max 120 characters) for someone who has a ${streak}-day streak and completed ${completions} actions on "${topMission}" this week. Be supportive, concise, and inspiring.`;

    const mentorResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are Horizon, a supportive mentor. Generate short, motivational messages under 120 characters.",
          },
          { role: "user", content: mentorPrompt },
        ],
      }),
    });

    const mentorData = await mentorResponse.json();
    const mentorLine = mentorData.choices?.[0]?.message?.content?.trim() || "Keep pushing forward!";

    // Generate card image using AI
    const imagePrompt = `Create a beautiful, modern card design for a personal growth app called "Horizon". 

Card details:
- Background: Gradient from deep purple to warm orange (like a sunset horizon)
- Top: "Weekly Horizon" in elegant white text
- Center section with white text:
  * Name: "${displayName}"
  * Top Mission: "${topMission}" (${completions} completions)
  * Streak: ${streak} days 🔥
- Bottom: Inspirational quote in italics: "${mentorLine}"
- Overall aesthetic: Clean, minimal, modern, inspiring
- Size: Square card (1:1 aspect ratio)
- Style: Professional social media share card with rounded corners and subtle shadows`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    return new Response(
      JSON.stringify({
        image: imageUrl,
        displayName,
        topMission,
        completions,
        streak,
        mentorLine,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating share card:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Failed to generate share card" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
