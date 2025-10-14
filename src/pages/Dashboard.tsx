import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Smile, Target, TrendingUp, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Daily Pulse
            </CardTitle>
            <CardDescription>How are you feeling today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {["😊", "😐", "😔", "😤", "😴"].map((emoji, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-16 text-2xl rounded-xl hover:scale-105 transition-transform"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid of sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Today's Missions
              </CardTitle>
              <CardDescription>3 tasks to complete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="flex-1">Morning meditation</span>
                <span className="text-xs text-muted-foreground">10 min</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="flex-1">Journal about gratitude</span>
                <span className="text-xs text-muted-foreground">5 min</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="flex-1">Review weekly goals</span>
                <span className="text-xs text-muted-foreground">15 min</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress This Week
              </CardTitle>
              <CardDescription>You're on a 7-day streak!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Daily Check-ins</span>
                    <span className="text-sm font-medium">7/7</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-full gradient-primary" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Mission Completion</span>
                    <span className="text-sm font-medium">18/21</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[85%] gradient-warm" />
                  </div>
                </div>
              </div>
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
