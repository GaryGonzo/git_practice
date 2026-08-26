-- Surface each member's billing tier in the admin dashboard: which studio
-- (if any) covers them, or which individual cohort tier and subscription
-- status they're in. Lets the admin see who's paying what at a glance.

-- Postgres won't let CREATE OR REPLACE change a function's return columns,
-- so the existing overload has to be dropped first.
drop function if exists admin_user_overview();

create function admin_user_overview()
returns table (
  id uuid,
  first_name text,
  last_name text,
  email text,
  tier handicap_tier,
  weekly_goal smallint,
  marketing_opt_in boolean,
  created_at timestamptz,
  total_scores bigint,
  sessions_this_week bigint,
  last_active timestamptz,
  studio_name text,
  individual_tier text,
  subscription_status text
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true) then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id,
    p.first_name,
    p.last_name,
    u.email::text,
    p.tier,
    p.weekly_goal,
    p.marketing_opt_in,
    p.created_at,
    coalesce(s.total_scores, 0),
    coalesce(s.sessions_this_week, 0),
    s.last_active,
    st.name,
    p.individual_tier,
    p.subscription_status
  from profiles p
  join auth.users u on u.id = p.id
  left join studios st on st.id = p.studio_id
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
  order by p.created_at desc;
end;
$$;
