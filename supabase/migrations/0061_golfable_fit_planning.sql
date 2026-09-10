-- Golfable Fit: day planning (walks + workout days) and its own
-- notification preference, separate from the existing daily-Golfable
-- notification.

-- Multiple walks per day, each with a time of day and a duration in
-- 5-minute increments starting at 0.
create table if not exists fit_walks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  walk_date date not null,
  time_of_day time not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0 and duration_minutes % 5 = 0),
  created_at timestamptz not null default now()
);

alter table fit_walks enable row level security;
create policy "fit_walks_owner" on fit_walks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A planned workout day has no time -- a row existing for a date means
-- "I'm planning to train that day."
create table if not exists fit_workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  planned_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, planned_date)
);

alter table fit_workout_plans enable row level security;
create policy "fit_workout_plans_owner" on fit_workout_plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One notification preference per user: on/off plus a chosen time of day.
-- Separate from the existing daily-Golfable push entirely -- this is its
-- own reminder about today's planned workout or, if none, planning walks.
create table if not exists fit_notification_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  enabled boolean not null default false,
  notify_time time not null default '08:00',
  updated_at timestamptz not null default now()
);

alter table fit_notification_settings enable row level security;
create policy "fit_notification_settings_owner" on fit_notification_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotency guard, one send per user per day -- mirrors
-- daily_notification_runs, but keyed per-user since the send time is
-- user-chosen rather than one fixed global time. No RLS policies --
-- only the service role (the send job) touches it.
create table if not exists fit_notification_runs (
  user_id uuid not null references profiles(id) on delete cascade,
  run_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, run_date)
);

alter table fit_notification_runs enable row level security;
