import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Dumbbell, Wrench, Heart, DollarSign, Sparkles, Plus } from "lucide-react";

type MissionType = 'Mind' | 'Body' | 'Craft' | 'Relationships' | 'Finance' | 'Spirit' | 'Custom';
type CoachTone = 'Warm' | 'Direct' | 'Playful';

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [focusAreas, setFocusAreas] = useState<MissionType[]>([]);
  const [intent, setIntent] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState(15);
  const [daysPerWeek, setDaysPerWeek] = useState<string[]>([]);
  const [coachTone, setCoachTone] = useState<CoachTone | null>(null);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const focusAreaOptions: { value: MissionType; label: string; icon: any }[] = [
    { value: 'Mind', label: 'Mind', icon: Brain },
    { value: 'Body', label: 'Body', icon: Dumbbell },
    { value: 'Craft', label: 'Craft', icon: Wrench },
    { value: 'Relationships', label: 'Relationships', icon: Heart },
    { value: 'Finance', label: 'Finance', icon: DollarSign },
    { value: 'Spirit', label: 'Spirit', icon: Sparkles },
    { value: 'Custom', label: 'Custom', icon: Plus },
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const coachTones: { value: CoachTone; description: string }[] = [
    { value: 'Warm', description: 'Supportive and encouraging' },
    { value: 'Direct', description: 'Honest and challenging' },
    { value: 'Playful', description: 'Fun and lighthearted' },
  ];

  const toggleFocusArea = (area: MissionType) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else if (focusAreas.length < 3) {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const toggleDay = (day: string) => {
    if (daysPerWeek.includes(day)) {
      setDaysPerWeek(daysPerWeek.filter(d => d !== day));
    } else {
      setDaysPerWeek([...daysPerWeek, day]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return focusAreas.length === 3;
      case 2:
        return intent.trim().length > 10;
      case 3:
        return minutesPerDay > 0;
      case 4:
        return daysPerWeek.length > 0;
      case 5:
        return coachTone !== null;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: user.email?.split('@')[0] || 'User',
        });

      // Initialize user_stats
      await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          xp_total: 0,
          coins_total: 0,
          daily_streak: 0,
        });

      toast({
        title: "Welcome!",
        description: "Your account is set up. Head to Missions to get started.",
      });

      navigate('/app/missions');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        <Card className="rounded-2xl shadow-medium">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Choose 3 Focus Areas"}
              {step === 2 && "Why Now?"}
              {step === 3 && "Time Reality Check"}
              {step === 4 && "Days Available"}
              {step === 5 && "Your Motivation Style"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Select the areas you want to focus on"}
              {step === 2 && "What's driving this change?"}
              {step === 3 && "How many minutes per day can you commit?"}
              {step === 4 && "Which days work for you?"}
              {step === 5 && "How should your mentor coach you?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {focusAreaOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = focusAreas.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 rounded-xl justify-start ${
                        !isSelected && focusAreas.length >= 3 ? 'opacity-50' : ''
                      }`}
                      onClick={() => toggleFocusArea(option.value)}
                      disabled={!isSelected && focusAreas.length >= 3}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Textarea
                  placeholder="E.g., I want to be healthier, build better habits, grow my career..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="rounded-xl min-h-32"
                />
                <p className="text-sm text-muted-foreground">
                  {intent.length} characters (minimum 10)
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {[5, 10, 15, 30, 60].map((mins) => (
                      <Button
                        key={mins}
                        size="sm"
                        variant={minutesPerDay === mins ? "default" : "outline"}
                        onClick={() => setMinutesPerDay(mins)}
                        className="rounded-xl flex-1"
                      >
                        {mins} min
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                {weekDays.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={daysPerWeek.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <label
                      htmlFor={day}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {coachTones.map((style) => (
                  <Button
                    key={style.value}
                    variant={coachTone === style.value ? "default" : "outline"}
                    className="w-full h-auto p-4 rounded-xl justify-start"
                    onClick={() => setCoachTone(style.value)}
                  >
                    <div className="text-left">
                      <div className="font-semibold mb-1">{style.value}</div>
                      <div className="text-sm opacity-80">{style.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="rounded-xl flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="rounded-xl flex-1"
                disabled={!canProceed() || loading}
              >
                {loading ? "Setting up..." : step === totalSteps ? "Get Started" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
