export const analyticsConfig = {
  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_KEY || '',
    apiHost: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    personProfiles: 'identified_only' as const,
    capturePageView: true,
    capturePageLeave: true,
  },
  // Feature flags for gradual rollout
  features: {
    aiMetrics: import.meta.env.VITE_AI_METRICS_ENABLED === 'true',
    userFeedback: import.meta.env.VITE_USER_FEEDBACK_ENABLED === 'true',
    costTracking: import.meta.env.VITE_COST_TRACKING_ENABLED === 'true',
  },
  // Development vs production settings
  environment: import.meta.env.MODE === 'development' ? 'development' : 'production',
  // Debug mode for development
  debug: import.meta.env.MODE === 'development',
};
