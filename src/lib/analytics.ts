// Provider-agnostic analytics system
// Events are logged to console for MVP, can be easily swapped for real analytics provider

type AnalyticsEvent =
  | {
      event: "onboarding_completed";
      properties: {
        missions_count: number;
      };
    }
  | {
      event: "daily_pulse_completed";
      properties: {
        mood: number;
        suggestion_type?: string;
      };
    }
  | {
      event: "checkin_logged";
      properties: {
        mission_type: string;
        xp_awarded: number;
      };
    }
  | {
      event: "level_up";
      properties: {
        mission_type: string;
        new_level: number;
      };
    }
  | {
      event: "mentor_message";
      properties: {
        tokens_in: number;
        tokens_out: number;
      };
    }
  | {
      event: "share_card_generated";
      properties: {
        streak: number;
        completions: number;
      };
    }
  | {
      event: "integration_interest";
      properties: {
        integration_id: string;
        integration_name: string;
      };
    };

export const analytics = {
  track: (event: AnalyticsEvent["event"], properties: any) => {
    // Log to console for MVP
    console.log("[Analytics Event]", {
      event,
      properties,
      timestamp: new Date().toISOString(),
    });

    // In production, this would send to analytics provider:
    // Example for Mixpanel: mixpanel.track(event, properties)
    // Example for Segment: analytics.track(event, properties)
    // Example for PostHog: posthog.capture(event, properties)
  },
};
