-- Golfable Fit: a fitness side of the app (consultation intake, a
-- nutrition plan, and training blocks made of exercise circuits), gated
-- behind a profiles.fit_access flag -- same shape as is_admin -- since for
-- now it's visible to exactly one person, not rolled out generally.

alter table profiles add column if not exists fit_access boolean not null default false;

-- One-time consultation intake, editable going forward. Answers are mostly
-- qualitative, so stored as free text rather than forcing them into rigid
-- enums -- goal_weight_loss_lbs is the one number worth tracking progress
-- against.
create table if not exists fit_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  goals text,
  goal_weight_loss_lbs numeric,
  fitness_level text,
  injuries text,
  swing_focus text,
  tight_areas text,
  exercise_preferences text,
  updated_at timestamptz not null default now()
);

alter table fit_profiles enable row level security;
create policy "fit_profiles_owner" on fit_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One active nutrition plan per user -- edited in place rather than
-- versioned, since only the current plan matters day to day.
create table if not exists fit_nutrition_plans (
  user_id uuid primary key references profiles(id) on delete cascade,
  daily_calories integer,
  protein_level text,
  carb_level text,
  fat_level text,
  produce_level text,
  meals_per_day integer,
  rules text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table fit_nutrition_plans enable row level security;
create policy "fit_nutrition_plans_owner" on fit_nutrition_plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A training block is a multi-week phase (e.g. "Block 1", 4 weeks, 3x/week)
-- -- every session in it is the same circuit to start, so one block holds
-- one program rather than a day-by-day schedule.
create table if not exists fit_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  week_count integer not null,
  sessions_per_week integer not null,
  step_goal integer,
  care_notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'planned')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table fit_blocks enable row level security;
create policy "fit_blocks_owner" on fit_blocks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A block's circuit is broken into ordered sections (Foam Roll, Mobility
-- Warm-Up, Main Circuit, Finisher) -- set_count applies to every exercise
-- in the section (it's a circuit done for N rounds), null for a section
-- that isn't set-based (foam rolling).
create table if not exists fit_block_sections (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references fit_blocks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  set_count integer,
  order_index integer not null default 0
);

alter table fit_block_sections enable row level security;
create policy "fit_block_sections_owner" on fit_block_sections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists fit_block_exercises (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references fit_block_sections(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  prescription text,
  cue text,
  order_index integer not null default 0
);

alter table fit_block_exercises enable row level security;
create policy "fit_block_exercises_owner" on fit_block_exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per completed training day -- how the app knows you're at
-- 2/3 for the week without you tracking it by hand.
create table if not exists fit_workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  block_id uuid not null references fit_blocks(id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, block_id, completed_on)
);

alter table fit_workout_logs enable row level security;
create policy "fit_workout_logs_owner" on fit_workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Body weight over time -- same shape as handicap_history -- so progress
-- against goal_weight_loss_lbs has something to plot.
create table if not exists fit_body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  weight_lbs numeric not null,
  recorded_at timestamptz not null default now()
);

alter table fit_body_logs enable row level security;
create policy "fit_body_logs_owner" on fit_body_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed content: Gary's own consultation answers and Block 1 program, for
-- the one account with fit_access so far.
do $$
declare
  gary_id uuid := '49f0de4a-af0f-4ff8-9651-75ef0f448272';
  block1_id uuid;
  foam_roll_id uuid;
  warmup_id uuid;
  main_id uuid;
  finisher_id uuid;
begin
  update profiles set fit_access = true where id = gary_id;

  insert into fit_profiles (
    user_id, goals, goal_weight_loss_lbs, fitness_level, injuries, swing_focus, tight_areas, exercise_preferences
  ) values (
    gary_id,
    'Lose about 30 lbs.',
    30,
    '5-6 out of 10',
    'Knee injury -- train carefully around it. Getting over a wrist injury -- go gentle, but assume it''s fine unless it starts getting sore.',
    'Working on getting full rotation in the backswing -- it''s been helping a lot, so making it even more comfortable is the focus.',
    'Hamstrings, hip flexors, calves.',
    'Prefers bodyweight work, and exercises where the carryover to golf is visible.'
  )
  on conflict (user_id) do nothing;

  insert into fit_nutrition_plans (
    user_id, daily_calories, protein_level, carb_level, fat_level, produce_level, meals_per_day, rules
  ) values (
    gary_id,
    2000,
    'High',
    'Moderate -- largest carb serving right after training',
    'Low',
    'High volume of fruits and vegetables',
    4,
    array[
      'Limit liquid calories to lime/lemon juice and a splash of juice (cherry, pomegranate, etc.) in mocktails',
      'No calories after 8pm'
    ]
  )
  on conflict (user_id) do nothing;

  if not exists (select 1 from fit_blocks where user_id = gary_id and name = 'Block 1') then
    insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index)
    values (
      gary_id,
      'Block 1',
      4,
      3,
      8000,
      'Ice the knee morning and evening, and once more during the day if possible -- 10 min each time. Work thoracic mobility into warm-ups, training, and cool-downs. Mix in mobility for the tight areas using bodyweight and TRX work.',
      'active',
      1
    )
    returning id into block1_id;
    insert into fit_block_sections (block_id, user_id, title, set_count, order_index)
    values (block1_id, gary_id, 'Foam Roll', null, 0)
    returning id into foam_roll_id;

    insert into fit_block_exercises (section_id, user_id, name, prescription, cue, order_index) values
      (foam_roll_id, gary_id, 'Foam Roll', null, 'General mobility and health', 0);

    insert into fit_block_sections (block_id, user_id, title, set_count, order_index)
    values (block1_id, gary_id, 'Mobility Warm-Up', 2, 1)
    returning id into warmup_id;

    insert into fit_block_exercises (section_id, user_id, name, prescription, cue, order_index) values
      (warmup_id, gary_id, 'Cat/Cow', '6 reps', 'Spine mobility', 0),
      (warmup_id, gary_id, 'T-Rotation from Table Top', '4 reps each side', 'T-spine rotation', 1);

    insert into fit_block_sections (block_id, user_id, title, set_count, order_index)
    values (block1_id, gary_id, 'Main Circuit', 3, 2)
    returning id into main_id;

    insert into fit_block_exercises (section_id, user_id, name, prescription, cue, order_index) values
      (main_id, gary_id, 'TRX Row', '12 reps', 'Scapular depression, shoulder stability, back strength, light strength encouragement for the knee', 0),
      (main_id, gary_id, 'TRX Assisted Reverse Lunge Hold', '20 sec each side', 'Hip flexor mobility, safe knee strength building, balance', 1),
      (main_id, gary_id, 'Decline TRX Assisted Squat', '6 reps, 5 sec each', 'Hip mobility, hip and knee strength', 2),
      (main_id, gary_id, 'TRX Push-Up', '10 reps', 'Shoulder stability and mobility, core strength, chest strength', 3),
      (main_id, gary_id, 'Single-Arm TRX Rotational Row', '6 reps each arm', 'Grip and back strength, shoulder stability, t-spine mobility, core strength, coordination and balance', 4),
      (main_id, gary_id, 'Hard-Style Plank', '20 sec', 'Core stability and strength', 5),
      (main_id, gary_id, 'Pike Hold', '20 sec', 'Shoulder strength, low back/hamstring/calf stretch and mobility', 6);

    insert into fit_block_sections (block_id, user_id, title, set_count, order_index)
    values (block1_id, gary_id, 'Finisher', 2, 3)
    returning id into finisher_id;

    insert into fit_block_exercises (section_id, user_id, name, prescription, cue, order_index) values
      (finisher_id, gary_id, 'Stick Reverse Lunge Hold w/ Contralateral Rotation', '5 reps each side', 'Safe knee strength, hip flexor stretch, t-spine mobility', 0);
  end if;
end $$;
