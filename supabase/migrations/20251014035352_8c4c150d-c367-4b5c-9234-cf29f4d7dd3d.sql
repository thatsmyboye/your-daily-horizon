-- Enums
create type mission_type as enum ('Mind','Body','Craft','Relationships','Finance','Spirit','Custom');

-- Users profile
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);

-- Missions
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  type mission_type not null,
  intent text,
  cadence text,
  target_per_week int default 5,
  active boolean default true,
  level int default 1,
  xp int default 0,
  created_at timestamptz default now()
);

-- Daily Pulse (journal + micro-habit)
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  mood int check (mood between 1 and 5),
  reflections text,
  ai_prompt text,
  ai_suggestion text,
  completed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Habit completions (per mission)
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mission_id uuid references public.missions(id) on delete cascade not null,
  entry_id uuid references public.daily_entries(id) on delete set null,
  occurred_at timestamptz default now(),
  xp_awarded int default 10
);

-- Mentor memory (short-term context)
create table public.mentor_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  note text not null,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index missions_user_id_idx on missions(user_id);
create index daily_entries_user_id_date_idx on daily_entries(user_id, date);
create index checkins_user_id_mission_id_idx on checkins(user_id, mission_id);

-- RLS
alter table profiles enable row level security;
alter table missions enable row level security;
alter table daily_entries enable row level security;
alter table checkins enable row level security;
alter table mentor_notes enable row level security;

create policy "user can read/write own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "user owns missions" on missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns entries" on daily_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns checkins" on checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns mentor notes" on mentor_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);