// Shared AI monitoring utilities for Edge Functions

interface AIMetricData {
  functionName: string;
  userId: string;
  requestId: string;
  startTime: number;
  endTime: number;
  tokensIn: number;
  tokensOut: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  retryCount?: number;
  contextSize?: number;
}

export class AIMonitoring {
  private static instance: AIMonitoring;
  private supabaseUrl: string;
  private supabaseServiceKey: string;

  constructor() {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    this.supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  }

  static getInstance(): AIMonitoring {
    if (!AIMonitoring.instance) {
      AIMonitoring.instance = new AIMonitoring();
    }
    return AIMonitoring.instance;
  }

  async trackMetric(data: AIMetricData): Promise<void> {
    try {
      const responseTime = data.endTime - data.startTime;
      const cost = this.calculateCost(data.tokensIn, data.tokensOut);

      const metric = {
        function_name: data.functionName,
        user_id: data.userId,
        request_id: data.requestId,
        response_time_ms: responseTime,
        tokens_in: data.tokensIn,
        tokens_out: data.tokensOut,
        cost_estimate: cost,
        success: data.success,
        error_type: data.errorType,
        error_message: data.errorMessage,
        model_used: 'google/gemini-2.5-flash',
        cache_hit: false,
        retry_count: data.retryCount || 0,
        context_size: data.contextSize || 0,
        timestamp: new Date(data.startTime).toISOString(),
      };

      // Store in database
      const response = await fetch(`${this.supabaseUrl}/rest/v1/ai_metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': this.supabaseServiceKey,
        },
        body: JSON.stringify(metric),
      });

      if (!response.ok) {
        console.error('Failed to store AI metric:', await response.text());
      }
    } catch (error) {
      console.error('Error tracking AI metric:', error);
    }
  }

  private calculateCost(tokensIn: number, tokensOut: number): number {
    // Gemini 2.5 Flash pricing: $0.075/1M input, $0.30/1M output
    const inputCost = (tokensIn / 1000000) * 0.075;
    const outputCost = (tokensOut / 1000000) * 0.30;
    return inputCost + outputCost;
  }

  // Helper to estimate tokens (rough approximation)
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Generate request ID
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const aiMonitoring = AIMonitoring.getInstance();
