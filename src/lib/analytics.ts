// Enhanced analytics system with PostHog integration
// This file maintains backward compatibility while providing enhanced analytics

import { analytics as enhancedAnalytics } from './analytics/service';

// Legacy event types for backward compatibility
type LegacyAnalyticsEvent =
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

// Legacy analytics object for backward compatibility
export const analytics = {
  track: (event: LegacyAnalyticsEvent["event"], properties: any) => {
    // Use enhanced analytics if available, fallback to console
    if (enhancedAnalytics.isInitialized()) {
      enhancedAnalytics.track(event, properties);
    } else {
      // Fallback to console logging
      console.log("[Analytics Event]", {
        event,
        properties,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

// Export enhanced analytics for new features
export { enhancedAnalytics };
