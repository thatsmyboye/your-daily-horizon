import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "free" | "premium";

export interface SubscriptionLimits {
  maxMissions: number;
  mentorMessagesPerDay: number;
  hasAdvancedAnalytics: boolean;
  hasCustomMentorTone: boolean;
  hasCalendarExport: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    maxMissions: 3,
    mentorMessagesPerDay: 40,
    hasAdvancedAnalytics: false,
    hasCustomMentorTone: false,
    hasCalendarExport: false,
  },
  premium: {
    maxMissions: Infinity,
    mentorMessagesPerDay: Infinity,
    hasAdvancedAnalytics: true,
    hasCustomMentorTone: true,
    hasCalendarExport: true,
  },
};

export const checkSubscription = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return { plan: "free" as SubscriptionPlan };

    const { data, error } = await supabase.functions.invoke("check-subscription");

    if (error) {
      console.error("Error checking subscription:", error);
      return { plan: "free" as SubscriptionPlan };
    }

    return {
      plan: (data?.plan || "free") as SubscriptionPlan,
      subscriptionEnd: data?.subscription_end,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { plan: "free" as SubscriptionPlan };
  }
};

export const getUserPlan = async (userId: string): Promise<SubscriptionPlan> => {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  return (data?.subscription_plan as SubscriptionPlan) || "free";
};

export const getPlanLimits = (plan: SubscriptionPlan): SubscriptionLimits => {
  return PLAN_LIMITS[plan];
};

export const canCreateMission = async (userId: string): Promise<boolean> => {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  if (limits.maxMissions === Infinity) return true;

  const { count } = await supabase
    .from("missions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);

  return (count || 0) < limits.maxMissions;
};

export const getMentorMessageCount = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("mentor_notes")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  return data?.length || 0;
};

export const canSendMentorMessage = async (userId: string): Promise<boolean> => {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  if (limits.mentorMessagesPerDay === Infinity) return true;

  const count = await getMentorMessageCount(userId);
  return count < limits.mentorMessagesPerDay;
};
