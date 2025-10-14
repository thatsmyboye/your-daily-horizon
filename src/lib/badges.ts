import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type Badge = {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
};

const BADGE_DEFINITIONS = {
  "streak-7": {
    name: "Week Warrior",
    description: "Seven days of showing up. That's a pattern.",
  },
  "checkins-30": {
    name: "Consistency Champion",
    description: "Thirty actions logged. Momentum builds on itself.",
  },
} as const;

export const checkAndAwardBadges = async (userId: string) => {
  // Get user's current badges
  const { data: profile } = await supabase
    .from("profiles")
    .select("badges")
    .eq("id", userId)
    .single();

  const currentBadges = (profile?.badges as Badge[]) || [];
  const earnedBadgeIds = currentBadges.map((b) => b.id);
  const newBadges: Badge[] = [];

  // Check for 7-day streak
  if (!earnedBadgeIds.includes("streak-7")) {
    const { data: entries } = await supabase
      .from("daily_entries")
      .select("date, completed")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("date", { ascending: false })
      .limit(7);

    if (entries && entries.length >= 7) {
      // Check if they're consecutive
      const dates = entries.map((e) => new Date(e.date).getTime());
      let consecutive = true;
      for (let i = 1; i < dates.length; i++) {
        const dayDiff = Math.abs((dates[i - 1] - dates[i]) / (1000 * 60 * 60 * 24));
        if (dayDiff > 1) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) {
        newBadges.push({
          id: "streak-7",
          name: BADGE_DEFINITIONS["streak-7"].name,
          description: BADGE_DEFINITIONS["streak-7"].description,
          earnedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Check for 30 mission completions
  if (!earnedBadgeIds.includes("checkins-30")) {
    const { count } = await supabase
      .from("mission_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count && count >= 30) {
      newBadges.push({
        id: "checkins-30",
        name: BADGE_DEFINITIONS["checkins-30"].name,
        description: BADGE_DEFINITIONS["checkins-30"].description,
        earnedAt: new Date().toISOString(),
      });
    }
  }

  // Save new badges if any
  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges];
    await supabase
      .from("profiles")
      .update({ badges: updatedBadges })
      .eq("id", userId);

    // Show toast for each new badge
    newBadges.forEach((badge) => {
      toast({
        title: "🎉 Badge Earned!",
        description: `${badge.name} — ${badge.description}`,
      });
    });
  }

  return newBadges;
};

export const checkFirstLevelUpBadge = async (
  userId: string,
  missionId: string,
  missionTitle: string,
  newLevel: number
) => {
  if (newLevel !== 2) return; // Only award on first level-up (level 1 -> 2)

  const { data: profile } = await supabase
    .from("profiles")
    .select("badges")
    .eq("id", userId)
    .single();

  const currentBadges = (profile?.badges as Badge[]) || [];
  const badgeId = `first-levelup-${missionId}`;

  // Check if already earned
  if (currentBadges.some((b) => b.id === badgeId)) return;

  const newBadge: Badge = {
    id: badgeId,
    name: `${missionTitle} Initiate`,
    description: `First level-up in ${missionTitle}!`,
    earnedAt: new Date().toISOString(),
  };

  const updatedBadges = [...currentBadges, newBadge];
  await supabase.from("profiles").update({ badges: updatedBadges }).eq("id", userId);

  toast({
    title: "🎉 Badge Earned!",
    description: `${newBadge.name} — ${newBadge.description}`,
  });
};
