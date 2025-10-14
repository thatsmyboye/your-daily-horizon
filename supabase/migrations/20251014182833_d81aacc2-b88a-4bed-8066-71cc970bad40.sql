-- Drop old missions table structure and create new missions system
DROP TABLE IF EXISTS public.missions CASCADE;
DROP TABLE IF EXISTS public.checkins CASCADE;

-- Missions catalogue
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  bucket text CHECK (bucket IN ('Body','Mind','Connect','Create','Learn','Earn','Home','Reset','Reflect')),
  size text CHECK (size IN ('S','M','L')),
  cadence text CHECK (cadence IN ('daily','weekly','monthly','seasonal')) NOT NULL,
  xp int NOT NULL,
  coins int NOT NULL,
  instructions text,
  active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active missions"
  ON public.missions FOR SELECT
  USING (active = true);

-- User instances for today/this week/etc.
CREATE TABLE public.mission_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  period_id text NOT NULL,
  status text CHECK (status IN ('available','completed','claimed')) DEFAULT 'available',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(mission_id, user_id, period_id)
);

ALTER TABLE public.mission_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mission instances"
  ON public.mission_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own mission instances"
  ON public.mission_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission instances"
  ON public.mission_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Completions audit
CREATE TABLE public.mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_instance_id uuid REFERENCES public.mission_instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  xp_awarded int NOT NULL,
  coins_awarded int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON public.mission_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.mission_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User stats
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY,
  xp_total int DEFAULT 0,
  coins_total int DEFAULT 0,
  daily_streak int DEFAULT 0,
  last_daily_date date,
  freeze_available bool DEFAULT true,
  freeze_reset_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed initial missions
INSERT INTO public.missions (title, bucket, size, cadence, xp, coins, instructions) VALUES
('60-second stretch', 'Body', 'S', 'daily', 10, 5, 'Stand, roll shoulders x10, neck circles x5'),
('1,000 steps', 'Body', 'M', 'daily', 25, 10, 'Get at least 1,000 steps or 7 active minutes'),
('20-minute zone-2 walk', 'Body', 'L', 'daily', 60, 25, 'Walk at a comfortable pace for 20 minutes'),
('2-minute box breathing', 'Mind', 'S', 'daily', 10, 5, 'Inhale 4, hold 4, exhale 4, hold 4'),
('5-minute mindful scan', 'Mind', 'M', 'daily', 25, 10, 'Body scan meditation for 5 minutes'),
('Journal 10 lines', 'Mind', 'L', 'daily', 60, 25, 'What would make today 1% better?'),
('Send one appreciative text', 'Connect', 'S', 'daily', 10, 5, 'Tell someone one specific thing you appreciate'),
('Schedule a 15-min catch-up', 'Connect', 'M', 'weekly', 25, 10, 'Set up time to connect with someone'),
('Call someone you miss', 'Connect', 'L', 'weekly', 60, 25, 'Have a real conversation with someone you care about'),
('3-line ugly draft', 'Create', 'S', 'daily', 10, 5, 'Write anything—just 3 lines'),
('Sketch an idea', 'Create', 'M', 'daily', 25, 10, 'Draw or sketch for 5 minutes'),
('Ship a micro-post', 'Create', 'L', 'weekly', 60, 25, 'Share something you created'),
('Read 1 page', 'Learn', 'S', 'daily', 10, 5, 'One page, one idea'),
('Watch 5-min explainer', 'Learn', 'M', 'daily', 25, 10, 'Note 3 takeaways'),
('Practice a skill', 'Learn', 'L', 'weekly', 60, 25, '20 minutes of focused practice'),
('Log one expense', 'Earn', 'S', 'daily', 10, 5, 'Track where money goes'),
('Move $5 to savings', 'Earn', 'M', 'weekly', 25, 10, 'Build your buffer'),
('Apply to one opportunity', 'Earn', 'L', 'weekly', 60, 25, 'Gig, pitch, or outreach'),
('2-minute tidy', 'Home', 'S', 'daily', 10, 5, 'Pick a surface; clear or reset it'),
('Clear one surface', 'Home', 'M', 'weekly', 25, 10, 'Make one area shine'),
('Full laundry cycle', 'Home', 'L', 'weekly', 60, 25, 'Wash, dry, fold, put away'),
('Inbox zero for 2 minutes', 'Reset', 'S', 'daily', 10, 5, 'Archive at least 5 emails'),
('Batch-unsubscribe', 'Reset', 'M', 'weekly', 25, 10, 'Unsubscribe from 3+ emails'),
('Plan tomorrow top 3', 'Reset', 'L', 'daily', 60, 25, 'Set your priorities'),
('Write 1 gratitude', 'Reflect', 'S', 'daily', 10, 5, 'One specific thing and why'),
('Rose/Thorn/Bud', 'Reflect', 'M', 'weekly', 25, 10, 'High, low, and something to look forward to'),
('Weekly retro', 'Reflect', 'L', 'weekly', 60, 25, 'What worked, what did not, and what is next');