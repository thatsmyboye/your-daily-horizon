import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Target, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DailyPulse } from "@/components/DailyPulse";
import { ProgressMap } from "@/components/ProgressMap";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Here's what's happening with your growth today.</p>
      </motion.div>

      {/* Daily Pulse */}
      {userId && <DailyPulse userId={userId} />}

      {/* Grid of sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress Map */}
        {userId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProgressMap userId={userId} />
          </motion.div>
        )}
        {/* Today's Missions Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Today's Missions
              </CardTitle>
              <CardDescription>Quick access to your active missions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => navigate("/app/missions")}
              >
                View All Missions
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="rounded-2xl shadow-soft gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-8 w-8" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Need guidance?</h3>
                <p className="text-sm opacity-90">Chat with your AI mentor anytime.</p>
              </div>
              <Button variant="secondary" className="rounded-2xl" onClick={() => navigate("/app/mentor")}>
                Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
