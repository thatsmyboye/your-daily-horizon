import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database, Trash2, AlertCircle, Shield } from "lucide-react";
import { isAdmin, isTestModeEnabled } from "@/lib/admin";
import { motion } from "framer-motion";

export const TestModeSettings = () => {
  const [loading, setLoading] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const testModeEnabled = isTestModeEnabled();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setCheckingAdmin(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const adminStatus = await isAdmin(user.id);
      setIsUserAdmin(adminStatus);
    }
    setCheckingAdmin(false);
  };

  const handleSeedDemoData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data");

      if (error) throw error;

      toast({
        title: "Demo Data Seeded! ✓",
        description: `Created ${data.data.missions} missions, ${data.data.dailyEntries} entries, ${data.data.checkIns} check-ins, and ${data.data.mentorNotes} notes.`,
      });

      // Reload the page to show new data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error("Error seeding demo data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to seed demo data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm("Are you sure you want to delete ALL your data? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("reset-demo-data");

      if (error) throw error;

      toast({
        title: "Data Reset Complete ✓",
        description: "All demo data has been deleted.",
      });

      // Reload the page
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error("Error resetting demo data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset demo data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-4">Checking permissions...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isUserAdmin) {
    return (
      <Card className="rounded-2xl border-destructive/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <CardTitle>Admin Access Required</CardTitle>
          </div>
          <CardDescription>Test mode is only available for admin users</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have admin privileges. Contact a system administrator to gain access to
              test mode features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!testModeEnabled) {
    return (
      <Card className="rounded-2xl border-amber-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <CardTitle>Test Mode Disabled</CardTitle>
          </div>
          <CardDescription>Test mode is not enabled in your environment</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/20 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              To enable test mode, add <code className="text-sm">VITE_TEST_MODE=true</code> to your{" "}
              <code className="text-sm">.env</code> file and restart the development server.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Test Mode</h3>
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage demo data for local testing and development
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Seed Demo Data</CardTitle>
            </div>
            <CardDescription>
              Populate your account with realistic test data for development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              This will create:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>3 missions (Mind, Body, Craft)</li>
                <li>10 days of daily entries with varied moods</li>
                <li>20 check-ins spread across missions</li>
                <li>5 mentor notes</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> This will delete any existing data before seeding new demo
                data.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSeedDemoData}
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Demo Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="rounded-2xl border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <CardTitle>Reset Demo Data</CardTitle>
            </div>
            <CardDescription>Delete all your data and start fresh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Warning:</strong> This will permanently delete all missions, entries,
                check-ins, and notes. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleResetDemoData}
              disabled={loading}
              variant="destructive"
              className="w-full rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
