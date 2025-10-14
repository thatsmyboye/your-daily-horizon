import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import { BillingSettings } from "@/components/BillingSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getUserPlan } from "@/lib/subscription";

const Settings = () => {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || "");
    }

    const userPlan = await getUserPlan(user.id);
    setPlan(userPlan);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isPremium = plan === "premium";

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg">
              Profile
            </TabsTrigger>
            <TabsTrigger value="mentor" className="rounded-lg">
              Mentor Style
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg">
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    className="rounded-xl"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <Button className="rounded-xl" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentor">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mentor Style</CardTitle>
                    <CardDescription>
                      Customize how your AI mentor interacts with you
                    </CardDescription>
                  </div>
                  {!isPremium && (
                    <Badge variant="secondary">Premium Feature</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supportive Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Gentle, encouraging guidance
                    </p>
                  </div>
                  <Switch disabled={!isPremium} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Challenge Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Direct, honest feedback
                    </p>
                  </div>
                  <Switch disabled={!isPremium} />
                </div>
                {!isPremium && (
                  <p className="text-sm text-muted-foreground italic">
                    Upgrade to Premium to customize your mentor's tone
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to check in daily
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mission Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications for new missions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <BillingSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
