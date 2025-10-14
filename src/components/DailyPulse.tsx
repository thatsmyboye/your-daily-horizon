import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAndAwardBadges } from "@/lib/badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Smile, Loader2, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { analytics } from "@/lib/analytics";
import { validateUserText, truncateText } from "@/lib/validation";

interface DailyPulseProps {
  userId: string;
}

export const DailyPulse = ({ userId }: DailyPulseProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mood, setMood] = useState<number>(3);
  const [reflections, setReflections] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayEntry();
    calculateStreak();
  }, [userId]);

  const loadTodayEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setEntryId(data.id);
        setMood(data.mood || 3);
        setReflections(data.reflections || "");
        setAiPrompt(data.ai_prompt || "");
        setAiSuggestion(data.ai_suggestion || "");
        setHasCompletedToday(data.completed);
      } else {
        // Generate new pulse if none exists
        await generatePulse();
      }
    } catch (error: any) {
      console.error('Error loading entry:', error);
    }
  };

  const calculateStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('date, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        setStreak(0);
        return;
      }

      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < data.length; i++) {
        const entryDate = new Date(data[i].date);
        entryDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (error: any) {
      console.error('Error calculating streak:', error);
    }
  };

  const generatePulse = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-pulse', {
        body: { userId, date: today }
      });

      if (error) throw error;

      if (data?.ai_prompt && data?.ai_suggestion) {
        setAiPrompt(data.ai_prompt);
        setAiSuggestion(data.ai_suggestion);
      }
    } catch (error: any) {
      console.error('Error generating pulse:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate daily pulse",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const completePulse = async () => {
    // Validate reflections
    const validation = validateUserText(reflections);
    if (!validation.valid) {
      toast({
        title: "Invalid Input",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const truncatedReflections = truncateText(reflections);

      const entryData = {
        user_id: userId,
        date: today,
        mood,
        reflections: truncatedReflections,
        ai_prompt: aiPrompt,
        ai_suggestion: aiSuggestion,
        completed: true,
      };

      if (entryId) {
        // Update existing
        const { error } = await supabase
          .from('daily_entries')
          .update(entryData)
          .eq('id', entryId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('daily_entries')
          .insert([entryData])
          .select()
          .single();

        if (error) throw error;
        setEntryId(data.id);
      }

      setHasCompletedToday(true);
      await calculateStreak();

      toast({
        title: "Pulse Complete!",
        description: "Your daily reflection has been saved.",
      });

      // Track analytics event
      analytics.track("daily_pulse_completed", {
        mood,
        suggestion_type: aiSuggestion ? "ai_generated" : "none",
      });

      // Check for streak badges
      await checkAndAwardBadges(userId);
    } catch (error: any) {
      console.error('Error saving pulse:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save pulse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const moodEmojis = ["😔", "😕", "😐", "🙂", "😊"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Daily Pulse
              </CardTitle>
              <CardDescription>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</CardDescription>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-semibold">{streak} Day Streak</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">How are you feeling?</label>
              <span className="text-2xl">{moodEmojis[mood - 1]}</span>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(value) => setMood(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
              disabled={hasCompletedToday}
            />
          </div>

          {/* AI Prompt */}
          {generating ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : aiPrompt && (
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm font-medium mb-2">Today's Reflection</p>
              <p className="text-sm text-muted-foreground italic">{aiPrompt}</p>
            </div>
          )}

          {/* Reflections */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Reflections</label>
            <Textarea
              placeholder="What's on your mind today?..."
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              className="rounded-xl min-h-24"
              disabled={hasCompletedToday}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reflections.length}/2000 characters
            </p>
          </div>

          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm font-medium mb-2 text-primary">Micro-Habit for Today</p>
              <p className="text-sm">{aiSuggestion}</p>
            </div>
          )}

          {/* Complete Button */}
          <Button
            onClick={completePulse}
            className="w-full rounded-xl"
            disabled={loading || hasCompletedToday || !reflections.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : hasCompletedToday ? (
              "Completed ✓"
            ) : (
              "Complete Pulse"
            )}
          </Button>

          {hasCompletedToday && (
            <p className="text-xs text-center text-muted-foreground">
              Great job! Come back tomorrow for your next pulse.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
