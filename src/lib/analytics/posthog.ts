// PostHog Analytics Service with fallback for missing package
interface PostHogConfig {
  apiKey: string;
  apiHost: string;
  personProfiles: 'always' | 'identified_only';
  capturePageView: boolean;
  capturePageLeave: boolean;
}

// Mock PostHog implementation for when the package is not available
const createMockPostHog = () => ({
  init: (config: any) => {
    console.log('PostHog mock initialized with config:', config);
  },
  capture: (event: string, properties: any) => {
    console.log('[PostHog Mock] Event:', event, properties);
  },
  identify: (userId: string, traits: any) => {
    console.log('[PostHog Mock] Identify:', userId, traits);
  },
  group: (groupType: string, groupKey: string, traits: any) => {
    console.log('[PostHog Mock] Group:', groupType, groupKey, traits);
  },
  people: {
    set: (properties: any) => {
      console.log('[PostHog Mock] People set:', properties);
    }
  },
  reset: () => {
    console.log('[PostHog Mock] Reset');
  },
  get_distinct_id: () => 'anonymous',
});

// Try to import PostHog, fallback to mock if not available
let posthog: any;

try {
  // This will work if posthog-js is installed
  const posthogModule = require('posthog-js');
  posthog = posthogModule.default || posthogModule;
} catch (error) {
  console.warn('PostHog not available, using mock implementation. Install posthog-js to enable analytics.');
  posthog = createMockPostHog();
}

class PostHogAnalytics {
  private static instance: PostHogAnalytics;
  private initialized = false;

  static getInstance(): PostHogAnalytics {
    if (!PostHogAnalytics.instance) {
      PostHogAnalytics.instance = new PostHogAnalytics();
    }
    return PostHogAnalytics.instance;
  }

  async initialize(config: PostHogConfig): Promise<void> {
    if (this.initialized) return;

    // Only initialize if we have an API key
    if (!config.apiKey) {
      console.warn('PostHog API key not provided, analytics will be disabled');
      return;
    }

    posthog.init(config.apiKey, {
      api_host: config.apiHost,
      person_profiles: config.personProfiles,
      capture_pageview: config.capturePageView,
      capture_pageleave: config.capturePageLeave,
      loaded: (posthog: any) => {
        console.log('PostHog initialized');
        this.initialized = true;
      }
    });
  }

  // Enhanced tracking with context
  track(event: string, properties: Record<string, any> = {}): void {
    if (!this.initialized) {
      console.warn('PostHog not initialized, event not tracked:', event);
      return;
    }

    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      session_id: this.getSessionId(),
      user_agent: navigator.userAgent,
      url: window.location.href,
    };

    posthog.capture(event, enrichedProperties);
  }

  // User identification
  identify(userId: string, traits: Record<string, any> = {}): void {
    if (!this.initialized) {
      console.warn('PostHog not initialized, user not identified');
      return;
    }

    posthog.identify(userId, {
      ...traits,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
  }

  // Group identification for team features
  group(groupType: string, groupKey: string, traits: Record<string, any> = {}): void {
    if (!this.initialized) {
      console.warn('PostHog not initialized, group not identified');
      return;
    }

    posthog.group(groupType, groupKey, traits);
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('PostHog not initialized, properties not set');
      return;
    }

    posthog.people.set(properties);
  }

  // Reset user (for logout)
  reset(): void {
    if (!this.initialized) return;
    posthog.reset();
  }

  // Get session ID
  private getSessionId(): string {
    return posthog.get_distinct_id();
  }

  // Check if initialized
  isInitialized(): boolean {
    return this.initialized;
  }
}

export { PostHogAnalytics };