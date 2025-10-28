import { supabase } from '@/integrations/supabase/client';
import { enhancedAnalytics } from '@/lib/analytics';

interface UserFeedback {
  id?: string;
  feature: string;
  rating: number;
  feedback?: string;
  userId: string;
  sessionId?: string;
  timestamp?: Date;
}

interface FeedbackSummary {
  averageRating: number;
  totalResponses: number;
  recentFeedback: UserFeedback[];
  ratingDistribution: Record<number, number>;
}

class UserFeedbackService {
  private static instance: UserFeedbackService;

  static getInstance(): UserFeedbackService {
    if (!UserFeedbackService.instance) {
      UserFeedbackService.instance = new UserFeedbackService();
    }
    return UserFeedbackService.instance;
  }

  async submitFeedback(
    feature: string,
    rating: number,
    feedback?: string,
    sessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }

      // Store feedback in database
      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          feature,
          rating,
          feedback,
          session_id: sessionId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing feedback:', error);
        return { success: false, error: 'Failed to store feedback' };
      }

      // Track in analytics
      enhancedAnalytics.trackUserFeedback(feature, rating, feedback);

      return { success: true };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getFeedbackSummary(feature: string): Promise<FeedbackSummary | null> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('rating, feedback, timestamp')
        .eq('feature', feature)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          averageRating: 0,
          totalResponses: 0,
          recentFeedback: [],
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      // Calculate average rating
      const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
      const averageRating = totalRating / data.length;

      // Calculate rating distribution
      const ratingDistribution = data.reduce((dist, item) => {
        dist[item.rating] = (dist[item.rating] || 0) + 1;
        return dist;
      }, {} as Record<number, number>);

      // Get recent feedback
      const recentFeedback = data.slice(0, 10).map(item => ({
        feature,
        rating: item.rating,
        feedback: item.feedback,
        userId: 'anonymous', // Don't expose user IDs
        timestamp: new Date(item.timestamp),
      }));

      return {
        averageRating: Math.round(averageRating * 100) / 100,
        totalResponses: data.length,
        recentFeedback,
        ratingDistribution,
      };
    } catch (error) {
      console.error('Error getting feedback summary:', error);
      return null;
    }
  }

  async getUserFeedback(userId: string, feature?: string): Promise<UserFeedback[]> {
    try {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (feature) {
        query = query.eq('feature', feature);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user feedback:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        feature: item.feature,
        rating: item.rating,
        feedback: item.feedback,
        userId: item.user_id,
        sessionId: item.session_id,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return [];
    }
  }

  // Get feedback statistics for admin dashboard
  async getFeedbackStats(timeRange?: { start: Date; end: Date }): Promise<{
    totalFeedback: number;
    averageRating: number;
    featureStats: Record<string, { count: number; average: number }>;
    recentTrends: Array<{ date: string; count: number; average: number }>;
  }> {
    try {
      let query = supabase
        .from('user_feedback')
        .select('feature, rating, timestamp');

      if (timeRange) {
        query = query
          .gte('timestamp', timeRange.start.toISOString())
          .lte('timestamp', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching feedback stats:', error);
        return {
          totalFeedback: 0,
          averageRating: 0,
          featureStats: {},
          recentTrends: [],
        };
      }

      if (!data || data.length === 0) {
        return {
          totalFeedback: 0,
          averageRating: 0,
          featureStats: {},
          recentTrends: [],
        };
      }

      // Calculate overall stats
      const totalFeedback = data.length;
      const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;

      // Calculate feature stats
      const featureStats = data.reduce((stats, item) => {
        if (!stats[item.feature]) {
          stats[item.feature] = { count: 0, total: 0 };
        }
        stats[item.feature].count++;
        stats[item.feature].total += item.rating;
        return stats;
      }, {} as Record<string, { count: number; total: number }>);

      // Convert to averages
      Object.keys(featureStats).forEach(feature => {
        featureStats[feature] = {
          count: featureStats[feature].count,
          average: featureStats[feature].total / featureStats[feature].count,
        };
      });

      // Calculate recent trends (last 7 days)
      const trends: Record<string, { count: number; total: number }> = {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      data
        .filter(item => new Date(item.timestamp) >= sevenDaysAgo)
        .forEach(item => {
          const date = new Date(item.timestamp).toISOString().split('T')[0];
          if (!trends[date]) {
            trends[date] = { count: 0, total: 0 };
          }
          trends[date].count++;
          trends[date].total += item.rating;
        });

      const recentTrends = Object.entries(trends).map(([date, stats]) => ({
        date,
        count: stats.count,
        average: stats.total / stats.count,
      }));

      return {
        totalFeedback,
        averageRating: Math.round(averageRating * 100) / 100,
        featureStats,
        recentTrends,
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        featureStats: {},
        recentTrends: [],
      };
    }
  }
}

export const userFeedbackService = UserFeedbackService.getInstance();
export type { UserFeedback, FeedbackSummary };
