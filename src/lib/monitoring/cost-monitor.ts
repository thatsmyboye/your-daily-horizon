import { supabase } from '@/integrations/supabase/client';
import { enhancedAnalytics } from '@/lib/analytics';

interface CostAlert {
  id: string;
  type: 'daily_limit' | 'weekly_limit' | 'monthly_limit' | 'anomaly';
  threshold: number;
  current: number;
  percentage: number;
  timestamp: Date;
  resolved: boolean;
}

interface CostStats {
  daily: number;
  weekly: number;
  monthly: number;
  totalRequests: number;
  averageCostPerRequest: number;
  projectedMonthly: number;
}

class CostMonitor {
  private static instance: CostMonitor;
  private dailyLimit = 50; // $50/day
  private weeklyLimit = 300; // $300/week
  private monthlyLimit = 1000; // $1000/month
  private anomalyThreshold = 2.0; // 2x normal usage

  static getInstance(): CostMonitor {
    if (!CostMonitor.instance) {
      CostMonitor.instance = new CostMonitor();
    }
    return CostMonitor.instance;
  }

  async checkCosts(): Promise<CostAlert[]> {
    const alerts: CostAlert[] = [];
    
    try {
      // Get current cost statistics
      const stats = await this.getCostStats();
      
      // Check daily costs
      if (stats.daily > this.dailyLimit) {
        alerts.push({
          id: `daily_${Date.now()}`,
          type: 'daily_limit',
          threshold: this.dailyLimit,
          current: stats.daily,
          percentage: (stats.daily / this.dailyLimit) * 100,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Check weekly costs
      if (stats.weekly > this.weeklyLimit) {
        alerts.push({
          id: `weekly_${Date.now()}`,
          type: 'weekly_limit',
          threshold: this.weeklyLimit,
          current: stats.weekly,
          percentage: (stats.weekly / this.weeklyLimit) * 100,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Check monthly costs
      if (stats.monthly > this.monthlyLimit) {
        alerts.push({
          id: `monthly_${Date.now()}`,
          type: 'monthly_limit',
          threshold: this.monthlyLimit,
          current: stats.monthly,
          percentage: (stats.monthly / this.monthlyLimit) * 100,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Check for cost anomalies
      const anomaly = await this.detectCostAnomaly(stats);
      if (anomaly) {
        alerts.push(anomaly);
      }

      // Store alerts in database
      if (alerts.length > 0) {
        await this.storeAlerts(alerts);
      }

      // Track cost monitoring event
      enhancedAnalytics.trackEvent({
        event: "cost_monitoring_check",
        properties: {
          daily_cost: stats.daily,
          weekly_cost: stats.weekly,
          monthly_cost: stats.monthly,
          alerts_triggered: alerts.length,
          total_requests: stats.totalRequests,
        }
      });

    } catch (error) {
      console.error('Error checking costs:', error);
    }

    return alerts;
  }

  async getCostStats(timeRange?: { start: Date; end: Date }): Promise<CostStats> {
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(now);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get daily costs
      const { data: dailyData } = await supabase
        .from('ai_metrics')
        .select('cost_estimate')
        .gte('timestamp', startOfDay.toISOString())
        .eq('success', true);

      // Get weekly costs
      const { data: weeklyData } = await supabase
        .from('ai_metrics')
        .select('cost_estimate')
        .gte('timestamp', startOfWeek.toISOString())
        .eq('success', true);

      // Get monthly costs
      const { data: monthlyData } = await supabase
        .from('ai_metrics')
        .select('cost_estimate')
        .gte('timestamp', startOfMonth.toISOString())
        .eq('success', true);

      const daily = dailyData?.reduce((sum, item) => sum + item.cost_estimate, 0) || 0;
      const weekly = weeklyData?.reduce((sum, item) => sum + item.cost_estimate, 0) || 0;
      const monthly = monthlyData?.reduce((sum, item) => sum + item.cost_estimate, 0) || 0;
      
      const totalRequests = monthlyData?.length || 0;
      const averageCostPerRequest = totalRequests > 0 ? monthly / totalRequests : 0;
      
      // Project monthly cost based on current daily average
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const projectedMonthly = daily * daysInMonth;

      return {
        daily,
        weekly,
        monthly,
        totalRequests,
        averageCostPerRequest,
        projectedMonthly,
      };
    } catch (error) {
      console.error('Error getting cost stats:', error);
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        totalRequests: 0,
        averageCostPerRequest: 0,
        projectedMonthly: 0,
      };
    }
  }

  private async detectCostAnomaly(stats: CostStats): Promise<CostAlert | null> {
    try {
      // Get historical data for comparison
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historicalData } = await supabase
        .from('ai_metrics')
        .select('cost_estimate, timestamp')
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .eq('success', true);

      if (!historicalData || historicalData.length < 7) {
        return null; // Not enough data for anomaly detection
      }

      // Calculate average daily cost over the last 30 days
      const dailyCosts = this.groupByDay(historicalData);
      const averageDailyCost = dailyCosts.reduce((sum, cost) => sum + cost, 0) / dailyCosts.length;

      // Check if today's cost is significantly higher than average
      if (stats.daily > averageDailyCost * this.anomalyThreshold) {
        return {
          id: `anomaly_${Date.now()}`,
          type: 'anomaly',
          threshold: averageDailyCost * this.anomalyThreshold,
          current: stats.daily,
          percentage: (stats.daily / (averageDailyCost * this.anomalyThreshold)) * 100,
          timestamp: new Date(),
          resolved: false,
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting cost anomaly:', error);
      return null;
    }
  }

  private groupByDay(data: Array<{ cost_estimate: number; timestamp: string }>): number[] {
    const dailyCosts: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + item.cost_estimate;
    });

    return Object.values(dailyCosts);
  }

  private async storeAlerts(alerts: CostAlert[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .insert(alerts.map(alert => ({
          alert_type: alert.type,
          severity: this.getSeverity(alert.percentage),
          message: this.generateAlertMessage(alert),
          metadata: {
            threshold: alert.threshold,
            current: alert.current,
            percentage: alert.percentage,
          },
        })));

      if (error) {
        console.error('Error storing alerts:', error);
      }
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }

  private getSeverity(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage >= 200) return 'critical';
    if (percentage >= 150) return 'high';
    if (percentage >= 100) return 'medium';
    return 'low';
  }

  private generateAlertMessage(alert: CostAlert): string {
    switch (alert.type) {
      case 'daily_limit':
        return `Daily cost limit exceeded: $${alert.current.toFixed(2)} (${alert.percentage.toFixed(1)}% of $${alert.threshold} limit)`;
      case 'weekly_limit':
        return `Weekly cost limit exceeded: $${alert.current.toFixed(2)} (${alert.percentage.toFixed(1)}% of $${alert.threshold} limit)`;
      case 'monthly_limit':
        return `Monthly cost limit exceeded: $${alert.current.toFixed(2)} (${alert.percentage.toFixed(1)}% of $${alert.threshold} limit)`;
      case 'anomaly':
        return `Cost anomaly detected: $${alert.current.toFixed(2)} (${alert.percentage.toFixed(1)}% above normal)`;
      default:
        return `Cost alert: $${alert.current.toFixed(2)}`;
    }
  }

  // Set cost limits
  setLimits(daily: number, weekly: number, monthly: number): void {
    this.dailyLimit = daily;
    this.weeklyLimit = weekly;
    this.monthlyLimit = monthly;
  }

  // Get current limits
  getLimits(): { daily: number; weekly: number; monthly: number } {
    return {
      daily: this.dailyLimit,
      weekly: this.weeklyLimit,
      monthly: this.monthlyLimit,
    };
  }
}

export const costMonitor = CostMonitor.getInstance();
export type { CostAlert, CostStats };
