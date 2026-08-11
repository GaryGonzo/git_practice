-- Web Push subscriptions, one row per subscribed browser/device. The Edge
-- Function that actually sends pushes runs with the service role and reads
-- this table directly, bypassing RLS -- these policies only govern what a
-- signed-in member can do to their own rows from the client.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_member_idx on push_subscriptions (member_id);

alter table push_subscriptions enable row level security;

create policy "members manage their own push subscriptions"
  on push_subscriptions for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid());
