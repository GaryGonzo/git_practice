-- Golfable Fit: one row per completed routine, for tracking consistency.
-- Each user only ever sees and writes their own rows.

create table if not exists fit_routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  completed_on date not null,
  minutes smallint,
  exercises jsonb not null default '[]'::jsonb,
  exercise_count smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists fit_routine_logs_user_date on fit_routine_logs (user_id, completed_on desc);

alter table fit_routine_logs enable row level security;

drop policy if exists "own routine logs: read" on fit_routine_logs;
create policy "own routine logs: read" on fit_routine_logs for select using (auth.uid() = user_id);
drop policy if exists "own routine logs: insert" on fit_routine_logs;
create policy "own routine logs: insert" on fit_routine_logs for insert with check (auth.uid() = user_id);
drop policy if exists "own routine logs: delete" on fit_routine_logs;
create policy "own routine logs: delete" on fit_routine_logs for delete using (auth.uid() = user_id);
