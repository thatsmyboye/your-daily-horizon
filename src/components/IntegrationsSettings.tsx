import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BookOpen, Activity, Calendar, ExternalLink } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  comingSoon: boolean;
  link?: string;
}

const integrations: Integration[] = [
  {
    id: "notion",
    name: "Notion",
    description: "Sync your daily reflections and journal entries to Notion",
    icon: BookOpen,
    enabled: false,
    comingSoon: true,
    link: "https://notion.so",
  },
  {
    id: "apple-health",
    name: "Apple Health",
    description: "Import steps, sleep, and activity data for Body mission tracking",
    icon: Activity,
    enabled: false,
    comingSoon: true,
  },
  {
    id: "google-fit",
    name: "Google Fit",
    description: "Import fitness and wellness data for Body mission insights",
    icon: Activity,
    enabled: false,
    comingSoon: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Export your micro-habits and missions to Google Calendar",
    icon: Calendar,
    enabled: false,
    comingSoon: true,
  },
  {
    id: "apple-calendar",
    name: "Apple Calendar",
    description: "Sync your micro-habits to Apple Calendar",
    icon: Calendar,
    enabled: false,
    comingSoon: true,
  },
];

export const IntegrationsSettings = () => {
  const handleToggleClick = (integration: Integration) => {
    // Track analytics event
    analytics.track("integration_interest", {
      integration_id: integration.id,
      integration_name: integration.name,
    });

    // Show toast notification
    toast({
      title: "Coming Soon! 🚀",
      description: `${integration.name} integration is being developed. We've noted your interest!`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect Horizon with your favorite apps and services
        </p>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <integration.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        {integration.comingSoon && (
                          <Badge variant="secondary" className="text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{integration.description}</CardDescription>
                      {integration.link && (
                        <a
                          href={integration.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                        >
                          Learn more
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={integration.enabled}
                    disabled={integration.comingSoon}
                    onCheckedChange={() => handleToggleClick(integration)}
                  />
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-xl">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> These integrations are currently in development. Click any toggle
          to express your interest, and we'll prioritize based on demand.
        </p>
      </div>
    </div>
  );
};
