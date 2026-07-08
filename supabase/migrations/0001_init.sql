-- Golfable core schema: profiles, drills, the daily shared drill calendar, and scores.
-- Run this once in the Supabase SQL Editor (or via `supabase db push` once the CLI is linked).

create type handicap_tier as enum ('scratch', 'low', 'mid', 'high');
create type skill_category as enum ('driver', 'irons', 'wedges', 'putter');

-- One row per authenticated user, 1:1 with auth.users.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  tier handicap_tier not null,
  weekly_goal smallint not null default 4 check (weekly_goal between 1 and 7),
  created_at timestamptz not null default now()
);

-- The drill library. Mirrors the Drill type in packages/shared.
create table drills (
  id text primary key,
  name text not null,
  category skill_category not null,
  setup_description text not null,
  setup_equipment text[] not null,
  rules_description text not null,
  rules_scoring text[] not null,
  target_scratch text not null,
  target_low text not null,
  target_mid text not null,
  target_high text not null,
  max_score smallint not null,
  created_at timestamptz not null default now()
);

-- The shared calendar: which drill is "today's Golfable" for everyone, per date.
create table daily_golfable (
  date date primary key,
  drill_id text not null references drills (id)
);

-- Score log. A user can log at most one score per drill per day (re-running an
-- old drill from the Library is a different drill_id, so it's still allowed).
create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  drill_id text not null references drills (id),
  date date not null,
  score smallint not null check (score >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, drill_id, date)
);

create index scores_date_drill_idx on scores (date, drill_id);

-- Auto-create a profile row when someone signs up. The client passes
-- username/tier/weekly_goal in signUp()'s options.data so they land in
-- raw_user_meta_data.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, tier, weekly_goal)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'tier')::handicap_tier,
    coalesce((new.raw_user_meta_data ->> 'weekly_goal')::smallint, 4)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security

alter table profiles enable row level security;
alter table drills enable row level security;
alter table daily_golfable enable row level security;
alter table scores enable row level security;

-- Profiles: usernames are public (needed for the leaderboard); only the
-- owning user can change their own row. Inserts happen via the trigger above.
create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Drills and the daily calendar are public read-only content.
create policy "drills are publicly readable"
  on drills for select
  using (true);

create policy "daily golfable is publicly readable"
  on daily_golfable for select
  using (true);

-- Scores: everyone can read (needed for the leaderboard), but you can only
-- write, edit, or remove your own.
create policy "scores are publicly readable"
  on scores for select
  using (true);

create policy "users can insert their own scores"
  on scores for insert
  with check (auth.uid() = user_id);

create policy "users can update their own scores"
  on scores for update
  using (auth.uid() = user_id);

create policy "users can delete their own scores"
  on scores for delete
  using (auth.uid() = user_id);
