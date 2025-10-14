import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Target } from "lucide-react";
interface UserStats {
  xp_total: number;
  coins_total: number;
  daily_streak: number;
}
interface ProgressMapProps {
  userId: string;
}
export const ProgressMap = ({
  userId
}: ProgressMapProps) => {
  const [stats, setStats] = useState<UserStats>({
    xp_total: 0,
    coins_total: 0,
    daily_streak: 0
  });
  const [recentCompletions, setRecentCompletions] = useState<number>(0);
  useEffect(() => {
    loadData();
  }, [userId]);
  const loadData = async () => {
    try {
      // Load user stats
      const {
        data: statsData
      } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
      if (statsData) {
        setStats({
          xp_total: statsData.xp_total || 0,
          coins_total: statsData.coins_total || 0,
          daily_streak: statsData.daily_streak || 0
        });
      }

      // Load recent completions (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const {
        data: completions
      } = await supabase.from('mission_completions').select('*').eq('user_id', userId).gte('created_at', oneWeekAgo.toISOString());
      setRecentCompletions(completions?.length || 0);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };
  return <Card className="rounded-2xl shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress Overview
        </CardTitle>
        <CardDescription>
          Your journey so far
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }} className="p-4 rounded-xl bg-gradient-primary text-white bg-slate-500">
            <div className="text-3xl font-bold">{stats.xp_total}</div>
            <div className="text-sm opacity-90">Total XP</div>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.1
        }} className="p-4 rounded-xl bg-secondary text-secondary-foreground">
            <div className="text-3xl font-bold">{stats.coins_total}</div>
            <div className="text-sm opacity-90">Horizon Coins</div>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="p-4 rounded-xl bg-accent text-accent-foreground">
            <div className="text-3xl font-bold">{stats.daily_streak}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }} className="p-4 rounded-xl bg-muted text-muted-foreground">
            <div className="text-3xl font-bold">{recentCompletions}</div>
            <div className="text-sm">This Week</div>
          </motion.div>
        </div>

        {stats.xp_total === 0 && <div className="text-center p-6 bg-gradient-subtle rounded-xl">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Complete missions to start building your progress
            </p>
          </div>}
      </CardContent>
    </Card>;
};