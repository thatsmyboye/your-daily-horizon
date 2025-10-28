-- Create AI metrics table for monitoring AI performance
CREATE TABLE IF NOT EXISTS ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  request_id TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  tokens_in INTEGER NOT NULL,
  tokens_out INTEGER NOT NULL,
  cost_estimate DECIMAL(10,6) NOT NULL,
  success BOOLEAN NOT NULL,
  error_type TEXT,
  error_message TEXT,
  model_used TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  cache_hit BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  context_size INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ai_metrics_function_name_idx ON ai_metrics(function_name);
CREATE INDEX IF NOT EXISTS ai_metrics_timestamp_idx ON ai_metrics(timestamp);
CREATE INDEX IF NOT EXISTS ai_metrics_user_id_idx ON ai_metrics(user_id);
CREATE INDEX IF NOT EXISTS ai_metrics_success_idx ON ai_metrics(success);
CREATE INDEX IF NOT EXISTS ai_metrics_request_id_idx ON ai_metrics(request_id);

-- Create user feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  session_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user feedback
CREATE INDEX IF NOT EXISTS user_feedback_feature_idx ON user_feedback(feature);
CREATE INDEX IF NOT EXISTS user_feedback_timestamp_idx ON user_feedback(timestamp);
CREATE INDEX IF NOT EXISTS user_feedback_rating_idx ON user_feedback(rating);
CREATE INDEX IF NOT EXISTS user_feedback_user_id_idx ON user_feedback(user_id);

-- Create system alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for system alerts
CREATE INDEX IF NOT EXISTS system_alerts_type_idx ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS system_alerts_severity_idx ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS system_alerts_resolved_idx ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS system_alerts_created_at_idx ON system_alerts(created_at);

-- Create content safety logs table
CREATE TABLE IF NOT EXISTS content_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_hash TEXT NOT NULL,
  safety_score DECIMAL(3,2),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT NOT NULL CHECK (action_taken IN ('allow', 'block', 'redirect', 'escalate')),
  content_type TEXT NOT NULL,
  content_length INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for content safety logs
CREATE INDEX IF NOT EXISTS content_safety_user_id_idx ON content_safety_logs(user_id);
CREATE INDEX IF NOT EXISTS content_safety_timestamp_idx ON content_safety_logs(timestamp);
CREATE INDEX IF NOT EXISTS content_safety_severity_idx ON content_safety_logs(severity);
CREATE INDEX IF NOT EXISTS content_safety_action_idx ON content_safety_logs(action_taken);

-- Add RLS policies for ai_metrics
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own metrics
CREATE POLICY "Users can view own ai_metrics" ON ai_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert metrics
CREATE POLICY "Service role can insert ai_metrics" ON ai_metrics
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feedback
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for content_safety_logs
ALTER TABLE content_safety_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own safety logs
CREATE POLICY "Users can view own safety logs" ON content_safety_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert safety logs
CREATE POLICY "Service role can insert safety logs" ON content_safety_logs
  FOR INSERT WITH CHECK (true);

-- System alerts are admin-only (no RLS policies needed for now)
