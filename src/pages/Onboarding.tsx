import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState("");
  const navigate = useNavigate();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigate("/app");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
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
              {step === 1 && "Welcome to Horizon"}
              {step === 2 && "What are your goals?"}
              {step === 3 && "Choose your mentor style"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's get to know you better"}
              {step === 2 && "Tell us what you want to achieve"}
              {step === 3 && "How would you like your mentor to guide you?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">What should we call you?</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goals">What are your main goals?</Label>
                  <Textarea
                    id="goals"
                    placeholder="E.g., Build better habits, improve mental health, grow my career..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    className="rounded-xl min-h-32"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {["Supportive & Encouraging", "Direct & Challenging", "Balanced & Thoughtful"].map(
                    (style) => (
                      <Button
                        key={style}
                        variant="outline"
                        className="h-auto p-4 rounded-xl justify-start hover:border-primary"
                      >
                        <div className="text-left">
                          <div className="font-semibold mb-1">{style}</div>
                          <div className="text-sm text-muted-foreground">
                            {style === "Supportive & Encouraging" &&
                              "Gentle guidance with positive reinforcement"}
                            {style === "Direct & Challenging" && "Honest feedback to push you forward"}
                            {style === "Balanced & Thoughtful" &&
                              "A mix of support and constructive challenge"}
                          </div>
                        </div>
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} className="rounded-xl flex-1">
                  Back
                </Button>
              )}
              <Button onClick={handleNext} className="rounded-xl flex-1">
                {step === totalSteps ? "Get Started" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
