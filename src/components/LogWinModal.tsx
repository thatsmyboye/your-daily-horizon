import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAndAwardBadges, checkFirstLevelUpBadge } from "@/lib/badges";
import { analytics } from "@/lib/analytics";
import { validateUserText, truncateText } from "@/lib/validation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  type: string;
  xp: number;
  level: number;
}

interface LogWinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missions: Mission[];
  userId: string;
  onSuccess: () => void;
}

export const LogWinModal = ({ open, onOpenChange, missions, userId, onSuccess }: LogWinModalProps) => {
  const { toast } = useToast();
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMissionId) {
      toast({
        title: "Error",
        description: "Please select a mission",
        variant: "destructive",
      });
      return;
    }

    // Validate note if provided
    if (note) {
      const validation = validateUserText(note);
      if (!validation.valid) {
        toast({
          title: "Invalid Input",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const xpAwarded = 10;
      const truncatedNote = note ? truncateText(note, 500) : "";

      // Create check-in
      const { error: checkinError } = await supabase.from("checkins").insert([
        {
          user_id: userId,
          mission_id: selectedMissionId,
          xp_awarded: xpAwarded,
        },
      ]);

      if (checkinError) throw checkinError;

      // Get current mission data
      const { data: mission, error: missionError } = await supabase
        .from("missions")
        .select("id, title, xp, level, type")
        .eq("id", selectedMissionId)
        .single();

      if (missionError) throw missionError;

      // Calculate new XP and level
      const oldLevel = mission.level;
      const newXp = mission.xp + xpAwarded;
      const newLevel = Math.floor(newXp / 100) + 1;
      const leveledUp = newLevel > oldLevel;

      // Update mission with new XP and level
      const { error: updateError } = await supabase
        .from("missions")
        .update({
          xp: newXp,
          level: newLevel,
        })
        .eq("id", selectedMissionId);

      if (updateError) throw updateError;

      // Track analytics
      analytics.track("checkin_logged", {
        mission_type: mission.type,
        xp_awarded: xpAwarded,
      });

      // Check if leveled up
      if (leveledUp) {
        toast({
          title: "🚀 Level Up!",
          description: `${mission.title} Lv.${newLevel} — Momentum!`,
        });

        // Track level up
        analytics.track("level_up", {
          mission_type: mission.type,
          new_level: newLevel,
        });

        // Check for first level-up badge
        await checkFirstLevelUpBadge(userId, mission.id, mission.title, newLevel);
      } else {
        toast({
          title: "Win Logged!",
          description: `+${xpAwarded} XP awarded`,
        });
      }

      // Check for other badges (30 check-ins)
      await checkAndAwardBadges(userId);

      setSelectedMissionId("");
      setNote("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error logging win:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to log win",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Log a Quick Win</DialogTitle>
          <DialogDescription>
            Record progress on one of your missions and earn XP
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mission">Mission</Label>
            <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
              <SelectTrigger id="mission" className="rounded-xl">
                <SelectValue placeholder="Select a mission" />
              </SelectTrigger>
              <SelectContent>
                {missions.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.title} (Level {mission.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="What did you accomplish?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/500 characters</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="rounded-xl flex-1"
              disabled={loading || !selectedMissionId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Win (+10 XP)"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
