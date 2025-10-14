import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, Plus } from "lucide-react";
import { LogWinModal } from "./LogWinModal";

interface Mission {
  id: string;
  title: string;
  type: string;
  xp: number;
  level: number;
  target_per_week: number;
}

interface CheckIn {
  id: string;
  mission_id: string;
  occurred_at: string;
}

interface ProgressMapProps {
  userId: string;
}

export const ProgressMap = ({ userId }: ProgressMapProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ actions: 0, missions: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Load missions
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (missionsError) throw missionsError;
      setMissions(missionsData || []);

      // Load check-ins from last 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: checkInsData, error: checkInsError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('occurred_at', twoWeeksAgo.toISOString());

      if (checkInsError) throw checkInsError;
      setCheckIns(checkInsData || []);

      // Calculate weekly stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyCheckIns = (checkInsData || []).filter(
        (c) => new Date(c.occurred_at) >= oneWeekAgo
      );
      const uniqueMissions = new Set(weeklyCheckIns.map((c) => c.mission_id));

      setWeeklyStats({
        actions: weeklyCheckIns.length,
        missions: uniqueMissions.size,
      });
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const getMissionCheckIns = (missionId: string) => {
    return checkIns.filter((c) => c.mission_id === missionId);
  };

  const getCadenceHealth = (mission: Mission) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyCheckIns = getMissionCheckIns(mission.id).filter(
      (c) => new Date(c.occurred_at) >= oneWeekAgo
    );
    
    const progress = weeklyCheckIns.length / mission.target_per_week;
    if (progress >= 1) return 'green';
    if (progress >= 0.7) return 'amber';
    return 'red';
  };

  const getNodeSize = (mission: Mission) => {
    // Base size + scaling based on level and XP
    return 40 + (mission.level * 5) + (mission.xp / 100);
  };

  const getRadialPosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const centerX = 200;
  const centerY = 200;
  const orbitRadius = 120;

  return (
    <>
      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Map
          </CardTitle>
          <CardDescription>
            This week you completed {weeklyStats.actions} actions across {weeklyStats.missions} missions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empty State */}
          {missions.length === 0 ? (
            <div className="w-full aspect-square bg-gradient-subtle rounded-2xl flex items-center justify-center p-8">
              <p className="text-center text-muted-foreground text-sm max-w-xs">
                Every action plants a star. Start with one small win today.
              </p>
            </div>
          ) : (
            <>
          {/* SVG Visualization */}
          <div className="w-full aspect-square bg-gradient-subtle rounded-2xl overflow-hidden">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {/* Mission nodes */}
              {missions.map((mission, index) => {
                const pos = getRadialPosition(index, missions.length, orbitRadius);
                const nodeSize = getNodeSize(mission);
                const cadenceColor = getCadenceHealth(mission);
                const missionCheckIns = getMissionCheckIns(mission.id);

                return (
                  <g key={mission.id}>
                    {/* Line to center */}
                    <motion.line
                      x1={centerX}
                      y1={centerY}
                      x2={centerX + pos.x}
                      y2={centerY + pos.y}
                      stroke={
                        cadenceColor === 'green'
                          ? 'hsl(var(--primary))'
                          : cadenceColor === 'amber'
                          ? 'hsl(var(--secondary))'
                          : 'hsl(var(--destructive))'
                      }
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />

                    {/* Mission node */}
                    <motion.g
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <circle
                        cx={centerX + pos.x}
                        cy={centerY + pos.y}
                        r={nodeSize / 2}
                        fill="hsl(var(--primary))"
                        opacity="0.2"
                      />
                      <circle
                        cx={centerX + pos.x}
                        cy={centerY + pos.y}
                        r={nodeSize / 2 - 5}
                        fill="hsl(var(--primary))"
                      />
                      <text
                        x={centerX + pos.x}
                        y={centerY + pos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="hsl(var(--primary-foreground))"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {mission.level}
                      </text>
                    </motion.g>

                    {/* Orbiting check-in dots */}
                    {missionCheckIns.slice(0, 5).map((checkIn, ciIndex) => {
                      const orbitAngle = (ciIndex / 5) * Math.PI * 2;
                      const orbitX = centerX + pos.x + Math.cos(orbitAngle) * (nodeSize / 2 + 15);
                      const orbitY = centerY + pos.y + Math.sin(orbitAngle) * (nodeSize / 2 + 15);

                      return (
                        <motion.circle
                          key={checkIn.id}
                          cx={orbitX}
                          cy={orbitY}
                          r="4"
                          fill="hsl(var(--accent))"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.1 + ciIndex * 0.05,
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Center indicator */}
              <circle
                cx={centerX}
                cy={centerY}
                r="8"
                fill="hsl(var(--foreground))"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Mission Legend */}
          {missions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Your Missions</p>
              <div className="grid grid-cols-2 gap-2">
                {missions.map((mission) => {
                  const cadence = getCadenceHealth(mission);
                  return (
                    <div
                      key={mission.id}
                      className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          cadence === 'green'
                            ? 'bg-primary'
                            : cadence === 'amber'
                            ? 'bg-secondary'
                            : 'bg-destructive'
                        }`}
                      />
                      <span className="truncate">{mission.title}</span>
                      <span className="ml-auto text-muted-foreground">L{mission.level}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Button onClick={() => setModalOpen(true)} className="w-full rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Log a Quick Win
          </Button>
          </>
          )}
        </CardContent>
      </Card>

      <LogWinModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        missions={missions}
        userId={userId}
        onSuccess={loadData}
      />
    </>
  );
};
