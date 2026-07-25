-- The app's "today"/"this week" boundary is now Pacific time everywhere
-- (see web-app's todayISO/startOfWeekISO). This function's "this week" and
-- "last active" columns were silently using the database session's default
-- timezone (UTC on Supabase), disagreeing with the client. Anchor the week
-- boundary to America/Los_Angeles explicitly so both sides agree.

create or replace function admin_user_overview()
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
  last_active timestamptz
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
    s.last_active
  from profiles p
  join auth.users u on u.id = p.id
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
