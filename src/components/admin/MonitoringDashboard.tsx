import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { userFeedbackService } from '@/lib/feedback/user-feedback';

interface MonitoringData {
  performance: {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    totalCost: number;
    tokenUsage: { in: number; out: number };
    errorRate: number;
    topErrors: Array<{ error: string; count: number }>;
  };
  engagement: {
    totalFeedback: number;
    averageRating: number;
    featureSatisfaction: Record<string, number>;
  };
}

export const MonitoringDashboard = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  useEffect(() => {
    fetchMonitoringData();
  }, [timeRange]);

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since we haven't implemented the backend API yet
      // In a real implementation, this would call a Supabase Edge Function
      const mockData: MonitoringData = {
        performance: {
          totalRequests: 1247,
          averageResponseTime: 1250,
          successRate: 0.987,
          totalCost: 12.45,
          tokenUsage: { in: 45600, out: 12300 },
          errorRate: 0.013,
          topErrors: [
            { error: 'Rate limit exceeded', count: 8 },
            { error: 'Invalid input', count: 3 },
            { error: 'AI gateway timeout', count: 2 },
          ],
        },
        engagement: {
          totalFeedback: 89,
          averageRating: 4.2,
          featureSatisfaction: {
            'daily-pulse': 4.5,
            'mentor-chat': 4.1,
            'mission-proposal': 3.9,
            'weekly-horizon': 4.3,
          },
        },
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No monitoring data available. Please check your configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setTimeRange({
              start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
            })}
          >
            Last 24h
          </Button>
          <Button
            variant="outline"
            onClick={() => setTimeRange({
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
            })}
          >
            Last 7 days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.performance.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.performance.errorRate > 0.05 ? (
                <span className="text-red-600">High error rate</span>
              ) : (
                <span className="text-green-600">Healthy</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performance.averageResponseTime.toLocaleString()}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {data.performance.averageResponseTime > 2000 ? (
                <span className="text-red-600">Slow response</span>
              ) : (
                <span className="text-green-600">Good performance</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.performance.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {data.performance.tokenUsage.in.toLocaleString()} in, {data.performance.tokenUsage.out.toLocaleString()} out tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Input Tokens</span>
                    <span className="font-medium">{data.performance.tokenUsage.in.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Output Tokens</span>
                    <span className="font-medium">{data.performance.tokenUsage.out.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Tokens</span>
                    <span className="font-medium">
                      {(data.performance.tokenUsage.in + data.performance.tokenUsage.out).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Input Cost</span>
                    <span className="font-medium">
                      ${((data.performance.tokenUsage.in / 1000000) * 0.075).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Output Cost</span>
                    <span className="font-medium">
                      ${((data.performance.tokenUsage.out / 1000000) * 0.30).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost</span>
                    <span>${data.performance.totalCost.toFixed(4)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Feedback</span>
                    <span className="text-2xl font-bold">{data.engagement.totalFeedback}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl font-bold">{data.engagement.averageRating}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(data.engagement.averageRating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data.engagement.featureSatisfaction).map(([feature, rating]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{feature.replace('-', ' ')}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.performance.topErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{error.error}</span>
                    <Badge variant="destructive">{error.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {data.performance.errorRate > 0.05 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High error rate detected: {(data.performance.errorRate * 100).toFixed(1)}%. 
            Please investigate the top errors above.
          </AlertDescription>
        </Alert>
      )}

      {data.performance.averageResponseTime > 2000 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Slow response times detected: {data.performance.averageResponseTime}ms average. 
            Consider optimizing AI requests or increasing timeout limits.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
