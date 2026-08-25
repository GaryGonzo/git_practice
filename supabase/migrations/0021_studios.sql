-- Studios: lightweight affiliate/partner accounts (e.g. an indoor golf
-- simulator studio) that get their own private leaderboard inside Golfable,
-- the same way a CrossFit affiliate runs its own box under the shared
-- brand. A studio is just a tag on top of the existing member/scores data
-- -- no separate deployment, branding system, or login. Studios are created
-- one at a time by a site admin (self-serve request flow is a future step),
-- and a member belongs to at most one studio at a time.

create table studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table profiles add column studio_id uuid references studios (id) on delete set null;

alter table studios enable row level security;

-- Same "publicly readable" shape as everything else -- the join landing
-- page and the studio leaderboard need to resolve a slug/id whether or not
-- the visitor is logged in yet.
create policy "studios are publicly readable"
  on studios for select
  using (true);

create policy "only admins can create studios"
  on studios for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "only admins can update studios"
  on studios for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));

-- Studio roster + participation, for the studio owner's "Manage your
-- studio" view. Mirrors admin_user_overview's shape, but scoped to one
-- studio and gated to that studio's own owner instead of a site admin.
create or replace function studio_roster(target_studio_id uuid)
returns table (
  id uuid,
  first_name text,
  last_name text,
  tier handicap_tier,
  weekly_goal smallint,
  created_at timestamptz,
  total_scores bigint,
  sessions_this_week bigint,
  last_active timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from studios where studios.id = target_studio_id and studios.owner_user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id,
    p.first_name,
    p.last_name,
    p.tier,
    p.weekly_goal,
    p.created_at,
    coalesce(s.total_scores, 0),
    coalesce(s.sessions_this_week, 0),
    s.last_active
  from profiles p
  left join (
    select
      scores.user_id as user_id,
      count(*) as total_scores,
      count(*) filter (
        where scores.created_at >= (
          date_trunc('week', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles'
        )
      ) as sessions_this_week,
      max(scores.created_at) as last_active
    from scores
    group by scores.user_id
  ) s on s.user_id = p.id
  where p.studio_id = target_studio_id
  order by p.created_at desc;
end;
$$;

grant execute on function studio_roster(uuid) to authenticated;
