import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Crown, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { checkSubscription, type SubscriptionPlan } from "@/lib/subscription";

export const BillingSettings = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();

    // Check for success parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Welcome to Premium! 🎉",
        description: "Your subscription is now active.",
      });
      // Remove success param from URL
      window.history.replaceState({}, "", window.location.pathname + "?tab=billing");
    }
  }, []);

  const loadSubscription = async () => {
    const result = await checkSubscription();
    setPlan(result.plan);
    setSubscriptionEnd(result.subscriptionEnd || null);
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = {
    free: [
      "Up to 3 missions",
      "Daily Pulse check-ins",
      "Mentor chat (40 messages/day)",
      "Basic Progress Map",
      "Streak tracking",
      "Badge system",
    ],
    premium: [
      "Unlimited missions",
      "Unlimited mentor chat",
      "Advanced analytics with trendlines",
      "Custom mentor tone",
      "Calendar export of micro-habits",
      "Priority support",
      "Early access to new features",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {plan === "premium"
              ? "You're on the Premium plan"
              : "You're on the Free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {plan === "premium" ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <Zap className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-semibold capitalize">{plan}</span>
              {plan === "premium" && (
                <Badge variant="default" className="ml-2">
                  Active
                </Badge>
              )}
            </div>
            {plan === "premium" && subscriptionEnd && (
              <span className="text-sm text-muted-foreground">
                Renews {new Date(subscriptionEnd).toLocaleDateString()}
              </span>
            )}
          </div>

          {plan === "premium" && (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Manage Subscription"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className={`rounded-2xl ${
              plan === "free" ? "border-primary border-2" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Free</CardTitle>
                {plan === "free" && (
                  <Badge variant="outline">Current Plan</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card
            className={`rounded-2xl ${
              plan === "premium" ? "border-primary border-2" : "border-primary/20"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Premium
                </CardTitle>
                {plan === "premium" && (
                  <Badge variant="default">Current Plan</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$8.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan === "free" && (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Premium
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
