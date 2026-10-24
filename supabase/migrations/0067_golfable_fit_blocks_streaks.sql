-- Golfable Fit: rotating 5-week blocks (build / deload / benchmark weeks,
-- a named goal and a "number to beat"), swap menus per exercise slot,
-- per-block mini goals, PR + streak badges, nutrition daily hits, and
-- end-of-block benchmark results. Every new table is owner-only under
-- RLS, same shape as the rest of fit_*.

-- 1. Blocks --------------------------------------------------------------

alter table fit_blocks add column if not exists goal_label text;
-- The block's "number to beat": which lift/test, the value, and its unit
-- (e.g. Bench Press / 155 / lbs, or Med-ball rotational throw / 30 / ft).
alter table fit_blocks add column if not exists target_exercise text;
alter table fit_blocks add column if not exists target_value numeric;
alter table fit_blocks add column if not exists target_unit text;
-- Monday the block starts on -- the screens derive "week N of M" from it.
-- Null on older blocks, which fall back to their existing behavior.
alter table fit_blocks add column if not exists start_date date;
alter table fit_blocks add column if not exists kind text not null default 'standard';
alter table fit_blocks drop constraint if exists fit_blocks_kind_check;
alter table fit_blocks add constraint fit_blocks_kind_check
  check (kind in ('standard', 'strength', 'hypertrophy', 'power', 'mobility', 'fat_loss'));

-- One row per week of a block. Weeks 1-4 build, week 5 deloads; a
-- benchmark week is a retest of the number to beat.
create table if not exists fit_block_weeks (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references fit_blocks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  week_number integer not null check (week_number >= 1),
  phase text not null default 'build' check (phase in ('build', 'deload', 'benchmark')),
  -- Percent of the block's working weight for that week (e.g. 70, 75, 80, 85, 60).
  intensity_pct integer check (intensity_pct between 0 and 150),
  notes text,
  unique (block_id, week_number)
);

alter table fit_block_weeks enable row level security;
create policy "fit_block_weeks_owner" on fit_block_weeks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table fit_workout_logs add column if not exists week_number integer check (week_number >= 1);

-- 2. Swap menus -----------------------------------------------------------

-- A fit_block_exercises row is the "slot"; its options are the menu the
-- player picks from (default first). No options = the slot's own exercise.
create table if not exists fit_exercise_options (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references fit_block_exercises(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  prescription text,
  cue text,
  is_default boolean not null default false,
  order_index integer not null default 0
);

create index if not exists fit_exercise_options_exercise_idx on fit_exercise_options (exercise_id);
-- At most one default per slot.
create unique index if not exists fit_exercise_options_one_default
  on fit_exercise_options (exercise_id) where is_default;

alter table fit_exercise_options enable row level security;
create policy "fit_exercise_options_owner" on fit_exercise_options for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table fit_exercise_logs add column if not exists chosen_option_id uuid
  references fit_exercise_options(id) on delete set null;

-- 3. Mini goals + badges --------------------------------------------------

create table if not exists fit_block_goals (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references fit_blocks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  -- 'lift' (top weight on target_exercise), 'steps', 'sleep', 'habit', ...
  metric text not null default 'habit',
  target numeric,
  achieved_at timestamptz,
  order_index integer not null default 0
);

alter table fit_block_goals enable row level security;
create policy "fit_block_goals_owner" on fit_block_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists fit_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  -- 'lift_pr', 'training_streak', 'protein_streak', 'kitchen_streak',
  -- 'water_streak', 'benchmark_beat', 'block_goal'
  type text not null,
  -- Lift name for a PR, streak length (7/14/21) for a streak, metric for a benchmark.
  label text not null,
  value numeric,
  exercise_id uuid references fit_block_exercises(id) on delete set null,
  workout_log_id uuid references fit_workout_logs(id) on delete cascade,
  earned_on date not null default (now() at time zone 'America/Los_Angeles')::date,
  earned_at timestamptz not null default now(),
  seen boolean not null default false
);

-- One PR badge per lift per workout; streak milestones once per streak start.
create unique index if not exists fit_badges_pr_once
  on fit_badges (user_id, label, workout_log_id) where type = 'lift_pr';
create unique index if not exists fit_badges_streak_once
  on fit_badges (user_id, type, label, value, earned_on) where type <> 'lift_pr';

alter table fit_badges enable row level security;
create policy "fit_badges_owner" on fit_badges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- When a workout flips to completed, award a lift_pr badge for each
-- weighted lift whose top set beats the best top set of every earlier
-- completed workout. Lifts are matched by the name actually performed
-- (the chosen swap option, else the slot's own name), so a PR carries
-- across blocks. Runs as the invoking user (not security definer) -- RLS
-- already lets the owner read their logs and insert their own badges.
create or replace function fit_award_lift_prs()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  insert into fit_badges (user_id, type, label, value, exercise_id, workout_log_id)
  select new.user_id, 'lift_pr', cur.lift, cur.top, cur.exercise_id, new.id
  from (
    select coalesce(o.name, e.name) as lift,
           max(l.actual_weight_lbs) as top,
           (array_agg(e.id))[1] as exercise_id
    from fit_exercise_logs l
    join fit_block_exercises e on e.id = l.exercise_id
    left join fit_exercise_options o on o.id = l.chosen_option_id
    where l.workout_log_id = new.id
      and l.completed
      and e.tracks_weight
      and l.actual_weight_lbs is not null
    group by coalesce(o.name, e.name)
  ) cur
  where cur.top > coalesce((
    select max(l2.actual_weight_lbs)
    from fit_exercise_logs l2
    join fit_workout_logs w2 on w2.id = l2.workout_log_id
    join fit_block_exercises e2 on e2.id = l2.exercise_id
    left join fit_exercise_options o2 on o2.id = l2.chosen_option_id
    where w2.user_id = new.user_id
      and w2.status = 'completed'
      and w2.id <> new.id
      and l2.completed
      and coalesce(o2.name, e2.name) = cur.lift
  ), 0)
  -- A first-ever log isn't a PR -- there's nothing to beat yet.
  and exists (
    select 1
    from fit_exercise_logs l3
    join fit_workout_logs w3 on w3.id = l3.workout_log_id
    join fit_block_exercises e3 on e3.id = l3.exercise_id
    left join fit_exercise_options o3 on o3.id = l3.chosen_option_id
    where w3.user_id = new.user_id
      and w3.status = 'completed'
      and w3.id <> new.id
      and l3.completed
      and l3.actual_weight_lbs is not null
      and coalesce(o3.name, e3.name) = cur.lift
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists fit_award_lift_prs on fit_workout_logs;
create trigger fit_award_lift_prs
  after update of status on fit_workout_logs
  for each row execute function fit_award_lift_prs();

revoke execute on function fit_award_lift_prs() from public, anon;

-- 4. Nutrition daily hits -------------------------------------------------

alter table fit_daily_logs add column if not exists protein_hits smallint not null default 0
  check (protein_hits between 0 and 8);
-- True = kitchen closed by 8pm that night.
alter table fit_daily_logs add column if not exists kitchen_closed_by boolean;

alter table fit_nutrition_plans add column if not exists protein_hits_goal smallint not null default 4;
alter table fit_nutrition_plans add column if not exists kitchen_close_time time not null default '20:00';

-- Per-day pass/fail for each nutrition streak, against the user's own
-- goals (water defaults to 110 oz when the plan has none set). The app
-- walks this backwards from today to get each current streak.
create or replace view fit_nutrition_day_hits
with (security_invoker = true)
as
select d.user_id,
       d.log_date,
       d.protein_hits >= coalesce(n.protein_hits_goal, 4) as protein_hit,
       coalesce(d.kitchen_closed_by, false) as kitchen_hit,
       d.water_oz >= coalesce(n.water_goal_oz, 110) as water_hit
from fit_daily_logs d
left join fit_nutrition_plans n on n.user_id = d.user_id;

-- 5. Benchmarks -----------------------------------------------------------

create table if not exists fit_benchmarks (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references fit_blocks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  metric text not null,
  value numeric not null,
  unit text,
  -- false for things like a timed carry where lower is better.
  higher_is_better boolean not null default true,
  tested_on date not null default (now() at time zone 'America/Los_Angeles')::date,
  created_at timestamptz not null default now()
);

create index if not exists fit_benchmarks_user_metric_idx on fit_benchmarks (user_id, metric, tested_on);

alter table fit_benchmarks enable row level security;
create policy "fit_benchmarks_owner" on fit_benchmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Each benchmark next to the previous result for the same metric, so the
-- screen can show "beat last time" without stitching history itself.
create or replace view fit_benchmark_comparisons
with (security_invoker = true)
as
select b.id,
       b.user_id,
       b.block_id,
       b.metric,
       b.value,
       b.unit,
       b.tested_on,
       b.higher_is_better,
       prev.value as previous_value,
       prev.tested_on as previous_tested_on,
       case
         when prev.value is null then null
         when b.higher_is_better then b.value > prev.value
         else b.value < prev.value
       end as beat_last_time
from fit_benchmarks b
left join lateral (
  select p.value, p.tested_on
  from fit_benchmarks p
  where p.user_id = b.user_id
    and p.metric = b.metric
    and (p.tested_on, p.created_at) < (b.tested_on, b.created_at)
  order by p.tested_on desc, p.created_at desc
  limit 1
) prev on true;
