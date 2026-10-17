-- Golfable Fit: the daily routine layer -- a repeating weekly schedule
-- (wake, meals, work, walks, lift, sim practice, wind-down) that the
-- Today screen turns into a checklist, plus water/sleep logging, a
-- Sunday check-in, gram-level macro targets, and per-item push reminders.

-- One row per thing on the weekly schedule. days_of_week uses JS
-- getDay() numbering (0 = Sunday). time_of_day is null for "anytime
-- today" items (Saturday's round, Sunday meal prep). template_index
-- points a lift item at the active block's Nth session template, so the
-- schedule survives moving from one block to the next.
create table if not exists fit_routine_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  days_of_week smallint[] not null,
  time_of_day time,
  title text not null,
  detail text,
  kind text not null default 'habit'
    check (kind in ('wake', 'meal', 'work', 'walk', 'lift', 'golf', 'mobility', 'recovery', 'sleep', 'habit', 'checkin')),
  template_index smallint,
  remind boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists fit_routine_items_user_idx on fit_routine_items(user_id);

alter table fit_routine_items enable row level security;
create policy "fit_routine_items_owner" on fit_routine_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A row existing means "done on that date".
create table if not exists fit_routine_checks (
  user_id uuid not null references profiles(id) on delete cascade,
  item_id uuid not null references fit_routine_items(id) on delete cascade,
  check_date date not null,
  checked_at timestamptz not null default now(),
  primary key (user_id, item_id, check_date)
);

alter table fit_routine_checks enable row level security;
create policy "fit_routine_checks_owner" on fit_routine_checks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per day: water drunk and last night's sleep.
create table if not exists fit_daily_logs (
  user_id uuid not null references profiles(id) on delete cascade,
  log_date date not null,
  water_oz integer not null default 0 check (water_oz >= 0),
  sleep_hours numeric(3, 1) check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 16)),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

alter table fit_daily_logs enable row level security;
create policy "fit_daily_logs_owner" on fit_daily_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The Sunday check-in, one per week (week_start = that week's Monday).
-- The computed numbers are snapshotted so history reads the way the week
-- looked when it was reviewed.
create table if not exists fit_weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  weight_avg numeric(5, 1),
  weigh_in_count integer not null default 0,
  workouts_done integer not null default 0,
  workouts_goal integer,
  steps_avg integer,
  sleep_avg numeric(3, 1),
  water_avg integer,
  round_score integer,
  biggest_leak text,
  stress smallint check (stress is null or stress between 1 and 10),
  adjustment text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table fit_weekly_checkins enable row level security;
create policy "fit_weekly_checkins_owner" on fit_weekly_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotency guard for routine reminders: one push per item per day.
-- Service role only (no policies), like fit_notification_runs.
create table if not exists fit_routine_reminder_runs (
  item_id uuid not null references fit_routine_items(id) on delete cascade,
  run_date date not null,
  sent_at timestamptz not null default now(),
  primary key (item_id, run_date)
);

alter table fit_routine_reminder_runs enable row level security;

-- Gram-level macro targets and a water goal alongside the existing
-- text levels; a sleep goal on the profile.
alter table fit_nutrition_plans add column if not exists protein_g integer;
alter table fit_nutrition_plans add column if not exists carbs_g integer;
alter table fit_nutrition_plans add column if not exists fat_g integer;
alter table fit_nutrition_plans add column if not exists water_goal_oz integer;
alter table fit_profiles add column if not exists sleep_goal_hours numeric(3, 1);

-- Seed Gary's plan (Weekly Game Plan, Oct 2026): work 9-3, lift at 3:30
-- Mon/Tue/Thu/Fri, sim practice Mon/Wed/Fri, Saturday round, dog walks at
-- 8:15 and 5:30, lights out at 11.
do $$
declare
  g uuid := '49f0de4a-af0f-4ff8-9651-75ef0f448272';
  wk smallint[] := array[1, 2, 3, 4, 5];
  everyday smallint[] := array[0, 1, 2, 3, 4, 5, 6];
  lift smallint[] := array[1, 2, 4, 5];
begin
  if not exists (select 1 from profiles where id = g) then
    return;
  end if;

  update fit_nutrition_plans
  set daily_calories = 2100, protein_g = 190, carbs_g = 200, fat_g = 60, water_goal_oz = 110, updated_at = now()
  where user_id = g;

  update fit_profiles set sleep_goal_hours = 7.5, updated_at = now() where user_id = g;

  if exists (select 1 from fit_routine_items where user_id = g) then
    return;
  end if;

  insert into fit_routine_items (user_id, days_of_week, time_of_day, title, detail, kind, template_index, remind, order_index) values
    (g, everyday, '06:30', 'Wake up', '20 oz water before coffee.', 'wake', null, false, 0),
    (g, wk, '06:35', 'Coffee + email', 'Capped at 40 min. 5 min of T-spine and hip flexor mobility while the coffee brews.', 'habit', null, false, 1),
    (g, everyday, '07:15', 'Meal 1: breakfast', '~45 g protein.', 'meal', null, false, 2),
    (g, wk, '08:15', 'Morning dog walk', '10 minutes before you leave.', 'walk', null, false, 3),
    (g, wk, '09:00', 'Work', 'Every hour, 5 min of stairs or hallway laps. Refill the 32 oz bottle once.', 'work', null, false, 4),
    (g, everyday, '12:00', 'Meal 2: lunch', '~45 g protein. Packed on workdays.', 'meal', null, false, 5),
    (g, lift, '14:30', 'Pre-lift snack (optional)', 'Fruit or yogurt.', 'meal', null, false, 6),
    (g, wk, '15:00', 'Work shutdown', 'Write tomorrow''s top 3 and close email.', 'work', null, true, 7),
    (g, array[1]::smallint[], '15:30', 'Lift: Lower A', '20 oz water during.', 'lift', 0, true, 8),
    (g, array[2]::smallint[], '15:30', 'Lift: Upper A', '20 oz water during.', 'lift', 1, true, 8),
    (g, array[4]::smallint[], '15:30', 'Lift: Lower B', '20 oz water during.', 'lift', 2, true, 8),
    (g, array[5]::smallint[], '15:30', 'Lift: Upper B', '20 oz water during.', 'lift', 3, true, 8),
    (g, array[3]::smallint[], '15:30', 'Sim: Golfable + wedges', 'Golfable (20 min), then 40 min of wedges from 40-110 yds to set targets. Putting mat if you have one.', 'golf', null, true, 8),
    (g, wk, '16:30', 'Meal 3: post-workout', 'Biggest carb serving of the day.', 'meal', null, false, 9),
    (g, array[3]::smallint[], '16:45', 'Mobility flow', '20 min: hip flexors, hamstrings, calves, T-spine.', 'mobility', null, false, 10),
    (g, array[1]::smallint[], '16:45', 'Sim: Golfable + full swing', 'Golfable (20 min), then 25 min on the biggest full-swing leak from Saturday. Default: backswing rotation, then driver to a fairway-width target.', 'golf', null, false, 10),
    (g, array[5]::smallint[], '16:45', 'Sim: Golfable + 9 holes', 'Golfable (10 min), then 9 holes on the sim with Saturday''s strategy: middle of greens, take your medicine after bad drives.', 'golf', null, false, 10),
    (g, array[2, 4]::smallint[], '16:45', 'Golfable (optional)', '15-20 min, only if you feel like it.', 'golf', null, false, 10),
    (g, everyday, '17:30', 'Evening dog walk', '30 min, phone in your pocket. Done when your wife gets home.', 'walk', null, true, 11),
    (g, everyday, '18:30', 'Meal 4: dinner', 'Finished by 7:30.', 'meal', null, false, 12),
    (g, everyday, '20:00', 'Kitchen closed', 'No calories and no work email from here.', 'habit', null, false, 13),
    (g, everyday, '22:30', 'Wind down', 'Dim the lights, close work apps, 10 min stretch. Slow breathing (4 in, 6 out) on wound-up days.', 'recovery', null, true, 14),
    (g, everyday, '23:00', 'Lights out', '7.5 hours to 6:30.', 'sleep', null, false, 15),
    (g, array[6]::smallint[], null, 'Round at Pine Ridge', 'Putting Golfable on the practice green first. Track fairways, GIR, putts, penalties and doubles. Walk it if the knee feels good.', 'golf', null, false, 0),
    (g, array[0]::smallint[], null, 'Meal prep', '60-90 min: protein and carbs for 5 lunches and post-workout meals.', 'meal', null, false, 0),
    (g, array[0]::smallint[], null, 'Sunday check-in', '15 min: weigh-in average, workouts, steps, sleep, Saturday''s leak.', 'checkin', null, false, 1);

  -- Training days for Block 3 (6 weeks from Mon Oct 19), so the existing
  -- daily Fit reminder knows which days are workout days.
  insert into fit_workout_plans (user_id, planned_date)
  select g, d::date
  from generate_series('2026-10-19'::date, '2026-11-29'::date, interval '1 day') as d
  where extract(dow from d) in (1, 2, 4, 5)
  on conflict (user_id, planned_date) do nothing;
end $$;
