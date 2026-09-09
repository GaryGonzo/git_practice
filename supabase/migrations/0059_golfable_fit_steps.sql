-- Golfable Fit: daily step logging. There's no health-app connection here
-- (HealthKit and Health Connect are both native-only, no web access at
-- all) so this is manual entry, same shape as body weight -- one row per
-- day, upserted if logged twice.

create table if not exists fit_step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  logged_date date not null default current_date,
  steps integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);

alter table fit_step_logs enable row level security;
create policy "fit_step_logs_owner" on fit_step_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
