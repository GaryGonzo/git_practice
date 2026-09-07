-- Golfable Fit, part 2: session templates and a real workout-logging flow.
--
-- A block used to hold its circuit directly (block -> sections ->
-- exercises). That only fit a block where every training day is
-- identical. Splitting sections off onto a session template (block ->
-- templates -> sections -> exercises) lets a future block define more
-- than one day (A/B/C) while Block 1's single template keeps working
-- exactly as before -- the week's slots just all point at it.
--
-- fit_workout_logs goes from "one row means one day logged" to a real
-- session instance: started when you tap into a workout, holding a row
-- per exercise (fit_exercise_logs) you check off and can adjust the
-- reps/time on, finished when you're done.

create table if not exists fit_session_templates (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references fit_blocks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  order_index integer not null default 0
);

alter table fit_session_templates enable row level security;
create policy "fit_session_templates_owner" on fit_session_templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table fit_block_sections add column if not exists session_template_id uuid references fit_session_templates(id) on delete cascade;

-- Backfill: every existing block gets one template ("Training Session A")
-- and its sections move onto it.
do $$
declare
  r record;
  new_template_id uuid;
begin
  for r in select id, user_id from fit_blocks loop
    if exists (select 1 from fit_block_sections where block_id = r.id and session_template_id is null) then
      insert into fit_session_templates (block_id, user_id, name, order_index)
      values (r.id, r.user_id, 'Training Session A', 0)
      returning id into new_template_id;

      update fit_block_sections set session_template_id = new_template_id
      where block_id = r.id and session_template_id is null;
    end if;
  end loop;
end $$;

alter table fit_block_sections alter column session_template_id set not null;
alter table fit_block_sections drop column if exists block_id;

-- fit_workout_logs: was (user_id, block_id, completed_on) with a uniqueness
-- constraint enforcing "at most one log per day". Now a row is a session
-- instance that can be in progress, so that constraint no longer holds --
-- multiple instances the same day are possible if one was abandoned and
-- restarted.
alter table fit_workout_logs drop constraint if exists fit_workout_logs_user_id_block_id_completed_on_key;
alter table fit_workout_logs add column if not exists session_template_id uuid references fit_session_templates(id) on delete set null;
alter table fit_workout_logs add column if not exists status text not null default 'completed' check (status in ('in_progress', 'completed'));
alter table fit_workout_logs add column if not exists started_at timestamptz not null default now();
alter table fit_workout_logs add column if not exists completed_at timestamptz;

-- Backfill: point old date-only logs at the block's one template and treat
-- their logged date as both start and completion.
update fit_workout_logs wl
set session_template_id = st.id,
    completed_at = coalesce(wl.completed_at, wl.completed_on::timestamptz)
from fit_session_templates st
where wl.session_template_id is null and st.block_id = wl.block_id;

create table if not exists fit_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references fit_workout_logs(id) on delete cascade,
  exercise_id uuid not null references fit_block_exercises(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  completed boolean not null default false,
  actual_prescription text,
  order_index integer not null default 0,
  unique (workout_log_id, exercise_id)
);

alter table fit_exercise_logs enable row level security;
create policy "fit_exercise_logs_owner" on fit_exercise_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
