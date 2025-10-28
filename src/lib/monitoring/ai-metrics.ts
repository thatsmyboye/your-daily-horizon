import { supabase } from '@/integrations/supabase/client';
import { enhancedAnalytics } from '@/lib/analytics';

interface AIMetric {
  id: string;
  functionName: string;
  userId: string;
  requestId: string;
  startTime: number;
  endTime: number;
  responseTime: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  modelUsed: string;
  cacheHit?: boolean;
  retryCount: number;
  contextSize: number;
}

class AIMetricsCollector {
  private metrics: Map<string, AIMetric> = new Map();
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private isFlushing = false;

  constructor() {
    // Flush metrics periodically
    setInterval(() => this.flushMetrics(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flushMetrics());
  }

  async collectMetric(metric: AIMetric): Promise<void> {
    this.metrics.set(metric.id, metric);
    
    // Track in analytics immediately
    if (metric.success) {
      enhancedAnalytics.trackAIResponse(
        metric.requestId,
        metric.functionName,
        metric.responseTime,
        metric.tokensIn,
        metric.tokensOut,
        true
      );
    } else {
      enhancedAnalytics.trackAIFailure(
        metric.requestId,
        metric.functionName,
        metric.errorMessage || 'Unknown error',
        metric.errorType || 'unknown',
        metric.retryCount,
        false
      );
    }

    // Batch flush if needed
    if (this.metrics.size >= this.batchSize) {
      await this.flushMetrics();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.size === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const metricsArray = Array.from(this.metrics.values());
    this.metrics.clear();

    try {
      // Store in database
      await this.storeMetricsInDatabase(metricsArray);
      
      console.log(`Flushed ${metricsArray.length} AI metrics to database`);
    } catch (error) {
      console.error('Failed to flush AI metrics:', error);
      // Re-add metrics to queue for retry
      metricsArray.forEach(metric => this.metrics.set(metric.id, metric));
    } finally {
      this.isFlushing = false;
    }
  }

  private async storeMetricsInDatabase(metrics: AIMetric[]): Promise<void> {
    if (metrics.length === 0) return;

    const { error } = await supabase
      .from('ai_metrics')
      .insert(metrics.map(metric => ({
        function_name: metric.functionName,
        user_id: metric.userId,
        request_id: metric.requestId,
        response_time_ms: metric.responseTime,
        tokens_in: metric.tokensIn,
        tokens_out: metric.tokensOut,
        cost_estimate: metric.cost,
        success: metric.success,
        error_type: metric.errorType,
        error_message: metric.errorMessage,
        model_used: metric.modelUsed,
        cache_hit: metric.cacheHit,
        retry_count: metric.retryCount,
        context_size: metric.contextSize,
        timestamp: new Date(metric.startTime).toISOString(),
      })));

    if (error) {
      console.error('Database error storing AI metrics:', error);
      throw error;
    }
  }

  // Helper method to create a metric
  createMetric(
    functionName: string,
    userId: string,
    requestId: string,
    startTime: number,
    endTime: number,
    tokensIn: number,
    tokensOut: number,
    success: boolean,
    errorType?: string,
    errorMessage?: string,
    retryCount: number = 0,
    contextSize: number = 0
  ): AIMetric {
    const responseTime = endTime - startTime;
    const cost = this.calculateCost(tokensIn, tokensOut);

    return {
      id: `${requestId}_${Date.now()}`,
      functionName,
      userId,
      requestId,
      startTime,
      endTime,
      responseTime,
      tokensIn,
      tokensOut,
      cost,
      success,
      errorType,
      errorMessage,
      modelUsed: 'google/gemini-2.5-flash',
      cacheHit: false,
      retryCount,
      contextSize,
    };
  }

  private calculateCost(tokensIn: number, tokensOut: number): number {
    // Gemini 2.5 Flash pricing: $0.075/1M input, $0.30/1M output
    const inputCost = (tokensIn / 1000000) * 0.075;
    const outputCost = (tokensOut / 1000000) * 0.30;
    return inputCost + outputCost;
  }

  // Get current metrics count
  getMetricsCount(): number {
    return this.metrics.size;
  }

  // Force flush metrics
  async forceFlush(): Promise<void> {
    await this.flushMetrics();
  }
}

export const aiMetricsCollector = new AIMetricsCollector();
export type { AIMetric };
