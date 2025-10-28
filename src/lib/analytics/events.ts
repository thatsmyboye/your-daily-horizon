export type AnalyticsEvent = 
  // User Journey Events
  | {
      event: "user_registered";
      properties: {
        registration_method: "email" | "google" | "github";
        time_to_complete: number;
        source?: string;
      };
    }
  | {
      event: "onboarding_completed";
      properties: {
        missions_created: number;
        focus_areas: string[];
        time_spent: number;
        completion_rate: number;
      };
    }
  
  // AI Interaction Events
  | {
      event: "ai_request_initiated";
      properties: {
        function_name: "generate-daily-pulse" | "mentor-chat" | "propose-missions" | "share-weekly-horizon";
        user_id: string;
        input_length: number;
        context_size: number;
        user_plan: "free" | "premium";
        request_id: string;
      };
    }
  | {
      event: "ai_request_completed";
      properties: {
        function_name: string;
        user_id: string;
        response_time_ms: number;
        tokens_in: number;
        tokens_out: number;
        cost_estimate: number;
        success: boolean;
        error_type?: string;
        model_used: string;
        cache_hit?: boolean;
        request_id: string;
      };
    }
  | {
      event: "ai_request_failed";
      properties: {
        function_name: string;
        user_id: string;
        error_message: string;
        error_code: string;
        retry_count: number;
        fallback_used: boolean;
        request_id: string;
      };
    }
  
  // Content Safety Events
  | {
      event: "content_safety_check";
      properties: {
        content_length: number;
        safety_score: number;
        severity: "low" | "medium" | "high" | "critical";
        action_taken: "allow" | "block" | "redirect" | "escalate";
        user_id: string;
        content_type: "mentor_message" | "daily_reflection" | "mission_intent";
      };
    }
  
  // User Engagement Events
  | {
      event: "daily_pulse_completed";
      properties: {
        mood: number;
        reflection_length: number;
        ai_suggestion_used: boolean;
        completion_time: number;
        streak_count: number;
      };
    }
  | {
      event: "mission_checkin";
      properties: {
        mission_id: string;
        mission_type: string;
        xp_awarded: number;
        level_up: boolean;
        streak_count: number;
      };
    }
  | {
      event: "mentor_session";
      properties: {
        session_duration: number;
        messages_exchanged: number;
        tool_calls_used: string[];
        user_satisfaction?: number;
      };
    }
  
  // Business Events
  | {
      event: "subscription_upgraded";
      properties: {
        from_plan: "free";
        to_plan: "premium";
        payment_method: string;
        revenue: number;
      };
    }
  | {
      event: "feature_usage";
      properties: {
        feature_name: string;
        usage_count: number;
        time_spent: number;
        success_rate: number;
      };
    }
  
  // User Feedback Events
  | {
      event: "user_feedback";
      properties: {
        feature: string;
        rating: number;
        feedback?: string;
        user_id: string;
        timestamp: string;
      };
    }
  
  // System Events
  | {
      event: "system_error";
      properties: {
        error_type: string;
        error_message: string;
        component: string;
        severity: "low" | "medium" | "high" | "critical";
        user_impact: boolean;
      };
    }
  | {
      event: "cost_alert_triggered";
      properties: {
        alert_type: string;
        threshold: number;
        current_cost: number;
        percentage: number;
      };
    };
