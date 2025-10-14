import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Target, Plus, Crown, AlertCircle } from "lucide-react";
import ProtectedRoute from "./ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { getUserPlan, getPlanLimits } from "@/lib/subscription";
import { useNavigate } from "react-router-dom";

const Missions = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const userPlan = await getUserPlan(user.id);
    setPlan(userPlan);

    const { data: missionsData } = await supabase
      .from("missions")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    setMissions(missionsData || []);
    setLoading(false);
  };

  const limits = getPlanLimits(plan);
  const canAddMission = plan === "premium" || missions.length < limits.maxMissions;
  const isNearLimit = plan === "free" && missions.length >= limits.maxMissions - 1;

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Your Missions</h1>
            <div className="flex items-center gap-2">
              {plan === "free" && (
                <span className="text-sm text-muted-foreground">
                  {missions.length}/{limits.maxMissions} missions
                </span>
              )}
              <Button
                onClick={() => navigate("/app/onboarding")}
                className="rounded-xl"
                disabled={!canAddMission}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Mission
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">Track your growth journey</p>

          {isNearLimit && (
            <Alert className="mt-4 border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  You're at your mission limit. Upgrade to add unlimited missions.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl ml-4"
                  onClick={() => navigate("/app/settings?tab=billing")}
                >
                  <Crown className="mr-2 h-3 w-3" />
                  Upgrade
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading missions...</div>
        ) : missions.length === 0 ? (
          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No missions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first mission to start your growth journey
              </p>
              <Button onClick={() => navigate("/app/onboarding")} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Create Mission
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="rounded-2xl shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Target className="h-6 w-6 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{mission.title}</h3>
                            {mission.intent && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {mission.intent}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">Level {mission.level}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>XP: {mission.xp}</span>
                          <span>Target: {mission.target_per_week}/week</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Missions;
