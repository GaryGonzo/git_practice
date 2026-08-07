-- The Husband App core schema: households, membership, a catalog of playful
-- requests (coffee, breakfast in bed, etc), honey-do tasks with points, a
-- points ledger, and per-person preference notes.
--
-- This is its own Supabase project, separate from Golfable's -- run this
-- once against a fresh project (SQL Editor or `supabase db push`).

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_emoji text not null default '🙂',
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index household_members_user_idx on household_members (user_id);

-- Global catalog of playful requests -- public, read-only, not
-- household-specific.
create table perk_catalog (
  key text primary key,
  label text not null,
  emoji text not null,
  sort_order smallint not null
);

insert into perk_catalog (key, label, emoji, sort_order) values
  ('coffee', 'Coffee', '☕', 1),
  ('breakfast_in_bed', 'Breakfast in bed', '🍳', 2),
  ('light_candles', 'Light candles', '🕯️', 3),
  ('draw_bath', 'Draw a bath', '🛁', 4),
  ('back_rub', 'Back rub', '💆', 5),
  ('foot_rub', 'Foot rub', '🦶', 6),
  ('snack_run', 'Snack run', '🍫', 7),
  ('flowers', 'Flowers', '💐', 8);

create table requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  requested_by uuid not null references profiles (id),
  assigned_to uuid not null references profiles (id),
  perk_key text references perk_catalog (key),
  custom_label text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (perk_key is not null or custom_label is not null)
);

create index requests_household_idx on requests (household_id, status);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid not null references profiles (id),
  assigned_to uuid references profiles (id),
  title text not null,
  description text,
  points smallint not null default 5 check (points >= 0),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_household_idx on tasks (household_id, status);

-- All writes go through complete_task()/award_bonus_points() below, so the
-- ledger stays the single source of truth for point totals.
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  member_id uuid not null references profiles (id),
  points integer not null,
  reason text not null,
  task_id uuid references tasks (id) on delete set null,
  created_at timestamptz not null default now()
);

create index points_ledger_member_idx on points_ledger (household_id, member_id);

-- Standing preference notes (e.g. "usual Starbucks order") -- readable by the
-- whole household so a partner can act on them, writable only by the owner.
create table preferences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  member_id uuid not null references profiles (id),
  category text not null check (category in ('coffee', 'starbucks', 'general')),
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create index preferences_household_idx on preferences (household_id, member_id);

-- Auto-create a profile row when someone signs up. The client passes
-- display_name in signUp()'s options.data so it lands in raw_user_meta_data.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Security-definer membership check, used by RLS policies below. Querying
-- household_members directly from its own select policy would recurse, so
-- policies call this instead.
create function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id and user_id = auth.uid()
  );
$$;

-- Creates a household, generates a unique invite code, and adds the caller
-- as its first member.
create function create_household(household_name text)
returns households
language plpgsql
security definer set search_path = public
as $$
declare
  new_household households;
  candidate_code text;
begin
  loop
    candidate_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from households where invite_code = candidate_code);
  end loop;

  insert into households (name, invite_code) values (household_name, candidate_code)
  returning * into new_household;

  insert into household_members (household_id, user_id) values (new_household.id, auth.uid());

  return new_household;
end;
$$;

-- Joins the caller to a household by invite code.
create function join_household(code text)
returns households
language plpgsql
security definer set search_path = public
as $$
declare
  target households;
begin
  select * into target from households where invite_code = upper(code);
  if target.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into household_members (household_id, user_id) values (target.id, auth.uid())
  on conflict (household_id, user_id) do nothing;

  return target;
end;
$$;

-- Marks a task done and awards its points in one transaction, so the ledger
-- can never drift out of sync with completed tasks. Idempotent: completing
-- an already-done task is a no-op rather than double-awarding points.
create function complete_task(target_task_id uuid)
returns tasks
language plpgsql
security definer set search_path = public
as $$
declare
  updated_task tasks;
  awardee uuid;
begin
  select * into updated_task from tasks where id = target_task_id;
  if updated_task.id is null then
    raise exception 'Task not found';
  end if;
  if not is_household_member(updated_task.household_id) then
    raise exception 'Not a member of this household';
  end if;
  if updated_task.status = 'done' then
    return updated_task;
  end if;

  awardee := coalesce(updated_task.assigned_to, auth.uid());

  update tasks set status = 'done', completed_at = now()
  where id = target_task_id
  returning * into updated_task;

  insert into points_ledger (household_id, member_id, points, reason, task_id)
  values (updated_task.household_id, awardee, updated_task.points, updated_task.title, updated_task.id);

  return updated_task;
end;
$$;

-- Lets any household member hand the other person bonus points outside the
-- task system (e.g. "for being amazing today, +10").
create function award_bonus_points(target_household_id uuid, target_member_id uuid, bonus_points integer, bonus_reason text)
returns points_ledger
language plpgsql
security definer set search_path = public
as $$
declare
  new_row points_ledger;
begin
  if not is_household_member(target_household_id) then
    raise exception 'Not a member of this household';
  end if;
  if not exists (
    select 1 from household_members
    where household_id = target_household_id and user_id = target_member_id
  ) then
    raise exception 'Target is not a member of this household';
  end if;

  insert into points_ledger (household_id, member_id, points, reason)
  values (target_household_id, target_member_id, bonus_points, bonus_reason)
  returning * into new_row;

  return new_row;
end;
$$;

-- Row Level Security

alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table perk_catalog enable row level security;
alter table requests enable row level security;
alter table tasks enable row level security;
alter table points_ledger enable row level security;
alter table preferences enable row level security;

-- Profiles: any signed-in user can read (needed to show a partner's name);
-- only the owner can update their own row. Inserts happen via the trigger.
create policy "profiles are readable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Households: readable only by members. Creation/joining goes through the
-- security-definer RPCs above, so no direct insert policy is needed.
create policy "households are readable by members"
  on households for select
  using (is_household_member(id));

create policy "members can read their household roster"
  on household_members for select
  using (is_household_member(household_id));

-- Perk catalog: public read-only content.
create policy "perk catalog is publicly readable"
  on perk_catalog for select
  using (true);

create policy "members can read household requests"
  on requests for select
  using (is_household_member(household_id));

create policy "members can create requests in their household"
  on requests for insert
  with check (is_household_member(household_id) and requested_by = auth.uid());

create policy "members can update requests in their household"
  on requests for update
  using (is_household_member(household_id));

create policy "members can delete their own requests"
  on requests for delete
  using (is_household_member(household_id) and requested_by = auth.uid());

-- Tasks are readable/writable by any household member directly (e.g. editing
-- a title or reassigning); completion should go through complete_task() so
-- points stay consistent, but the household is a trusted 2-person unit, not
-- an adversarial multi-tenant system, so we don't lock down direct updates.
create policy "members can read household tasks"
  on tasks for select
  using (is_household_member(household_id));

create policy "members can create tasks in their household"
  on tasks for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update tasks in their household"
  on tasks for update
  using (is_household_member(household_id));

create policy "members can delete tasks in their household"
  on tasks for delete
  using (is_household_member(household_id));

-- Points ledger is written only through the RPCs above -- no insert/update/
-- delete policies, just read.
create policy "members can read their household's points ledger"
  on points_ledger for select
  using (is_household_member(household_id));

-- Preferences: any member can read (so a partner can see "her Starbucks
-- order"), but only the owner can write their own notes.
create policy "members can read household preferences"
  on preferences for select
  using (is_household_member(household_id));

create policy "members can create their own preferences"
  on preferences for insert
  with check (is_household_member(household_id) and member_id = auth.uid());

create policy "members can update their own preferences"
  on preferences for update
  using (member_id = auth.uid());

create policy "members can delete their own preferences"
  on preferences for delete
  using (member_id = auth.uid());
