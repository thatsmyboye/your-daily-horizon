import { PostHogAnalytics } from './posthog';
import { AnalyticsEvent } from './events';
import { analyticsConfig } from './config';

export class AnalyticsService {
  private posthog: PostHogAnalytics;
  private userId?: string;
  private sessionStartTime: number;
  private requestCounter = 0;

  constructor() {
    this.posthog = PostHogAnalytics.getInstance();
    this.sessionStartTime = Date.now();
  }

  async initialize(): Promise<void> {
    await this.posthog.initialize(analyticsConfig.posthog);
  }

  // User identification
  identifyUser(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    this.posthog.identify(userId, {
      ...traits,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
  }

  // Enhanced event tracking with automatic enrichment
  trackEvent<T extends AnalyticsEvent>(event: T): void {
    const enrichedEvent = this.enrichEvent(event);
    this.posthog.track(enrichedEvent.event, enrichedEvent.properties);
  }

  // AI-specific tracking
  trackAIRequest(
    functionName: string,
    inputLength: number,
    contextSize: number = 0
  ): string {
    const requestId = this.generateRequestId();
    
    this.trackEvent({
      event: "ai_request_initiated",
      properties: {
        function_name: functionName,
        user_id: this.userId || 'anonymous',
        input_length: inputLength,
        context_size: contextSize,
        user_plan: this.getUserPlan(),
        request_id: requestId,
      }
    });

    return requestId;
  }

  trackAIResponse(
    requestId: string,
    functionName: string,
    responseTime: number,
    tokensIn: number,
    tokensOut: number,
    success: boolean,
    error?: string
  ): void {
    this.trackEvent({
      event: "ai_request_completed",
      properties: {
        function_name: functionName,
        user_id: this.userId || 'anonymous',
        response_time_ms: responseTime,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_estimate: this.calculateCost(tokensIn, tokensOut),
        success,
        error_type: error,
        model_used: 'google/gemini-2.5-flash',
        request_id: requestId,
      }
    });
  }

  trackAIFailure(
    requestId: string,
    functionName: string,
    errorMessage: string,
    errorCode: string,
    retryCount: number = 0,
    fallbackUsed: boolean = false
  ): void {
    this.trackEvent({
      event: "ai_request_failed",
      properties: {
        function_name: functionName,
        user_id: this.userId || 'anonymous',
        error_message: errorMessage,
        error_code: errorCode,
        retry_count: retryCount,
        fallback_used: fallbackUsed,
        request_id: requestId,
      }
    });
  }

  // Content safety tracking
  trackContentSafety(
    contentLength: number,
    safetyScore: number,
    severity: string,
    actionTaken: string,
    contentType: string
  ): void {
    this.trackEvent({
      event: "content_safety_check",
      properties: {
        content_length: contentLength,
        safety_score: safetyScore,
        severity,
        action_taken: actionTaken,
        user_id: this.userId || 'anonymous',
        content_type: contentType,
      }
    });
  }

  // User feedback tracking
  trackUserFeedback(
    feature: string,
    rating: number,
    feedback?: string
  ): void {
    this.trackEvent({
      event: "user_feedback",
      properties: {
        feature,
        rating,
        feedback,
        user_id: this.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      }
    });
  }

  // System error tracking
  trackSystemError(
    errorType: string,
    errorMessage: string,
    component: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userImpact: boolean = false
  ): void {
    this.trackEvent({
      event: "system_error",
      properties: {
        error_type: errorType,
        error_message: errorMessage,
        component,
        severity,
        user_impact: userImpact,
      }
    });
  }

  // Feature usage tracking
  trackFeatureUsage(
    featureName: string,
    usageCount: number,
    timeSpent: number,
    successRate: number
  ): void {
    this.trackEvent({
      event: "feature_usage",
      properties: {
        feature_name: featureName,
        usage_count: usageCount,
        time_spent: timeSpent,
        success_rate: successRate,
      }
    });
  }

  // Legacy support - maintain compatibility with existing analytics calls
  track(event: string, properties: Record<string, any> = {}): void {
    this.posthog.track(event, properties);
  }

  // Reset user (for logout)
  reset(): void {
    this.userId = undefined;
    this.posthog.reset();
  }

  // Private helper methods
  private enrichEvent<T extends AnalyticsEvent>(event: T): T {
    return {
      ...event,
      properties: {
        ...event.properties,
        session_duration: Date.now() - this.sessionStartTime,
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        environment: analyticsConfig.environment,
      }
    };
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserPlan(): "free" | "premium" {
    // This would integrate with your subscription service
    // For now, return a placeholder - you can implement this based on your user data
    return "free";
  }

  private calculateCost(tokensIn: number, tokensOut: number): number {
    // Gemini 2.5 Flash pricing
    const inputCost = (tokensIn / 1000000) * 0.075;
    const outputCost = (tokensOut / 1000000) * 0.30;
    return inputCost + outputCost;
  }

  // Check if analytics is initialized
  isInitialized(): boolean {
    return this.posthog.isInitialized();
  }
}

// Singleton instance
export const analytics = new AnalyticsService();
