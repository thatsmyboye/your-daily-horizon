import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Target, CheckCircle2, Circle } from "lucide-react";
import ProtectedRoute from "./ProtectedRoute";

const Missions = () => {
  const missions = [
    {
      id: 1,
      title: "Morning Meditation",
      description: "Start your day with 10 minutes of mindfulness",
      duration: "10 min",
      completed: false,
      priority: "high"
    },
    {
      id: 2,
      title: "Gratitude Journal",
      description: "Write down 3 things you're grateful for today",
      duration: "5 min",
      completed: true,
      priority: "medium"
    },
    {
      id: 3,
      title: "Weekly Review",
      description: "Reflect on your progress and plan ahead",
      duration: "15 min",
      completed: false,
      priority: "low"
    }
  ];

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Your Missions</h1>
          <p className="text-muted-foreground">Complete today's tasks to level up your growth</p>
        </motion.div>

        <div className="grid gap-4">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="rounded-2xl shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {mission.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-semibold ${mission.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {mission.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded-lg">
                          {mission.duration}
                        </span>
                      </div>
                      {!mission.completed && (
                        <Button size="sm" className="rounded-xl mt-3">
                          Start Mission
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Missions;
