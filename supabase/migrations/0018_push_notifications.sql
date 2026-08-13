-- Web push subscriptions, one row per device that's enabled notifications.
-- A user can have several (phone + desktop, etc). Private -- only the
-- owning user can read/write their own rows; the daily send job runs with
-- the service role key and bypasses RLS entirely.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "users can manage their own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Idempotency guard for the once-a-day 10:30am Pacific notification send.
-- The cron job fires every few minutes and only actually sends once the
-- Pacific wall clock reads ~10:30, so a row already existing for today is
-- what prevents a second send from a duplicate or overlapping run. No RLS
-- policies are defined -- only the service role (the send job) touches it.

create table daily_notification_runs (
  date date primary key,
  sent_at timestamptz not null default now(),
  recipient_count int not null
);

alter table daily_notification_runs enable row level security;
