-- Same RETURNS TABLE scoping issue as 0013, this time on created_at:
-- scores.created_at was unqualified inside the activity subquery, which is
-- ambiguous against the function's own `created_at` output column. Fully
-- qualifies every column reference in the function body so this class of
-- bug can't recur for any other output column name (id, first_name,
-- last_name, email, tier, weekly_goal, marketing_opt_in, created_at,
-- total_scores, sessions_this_week, last_active all collide with real
-- column names somewhere in this query).

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
      count(*) filter (where scores.created_at >= date_trunc('week', now())) as sessions_this_week,
      max(scores.created_at) as last_active
    from scores
    group by scores.user_id
  ) s on s.user_id = p.id
  order by p.created_at desc;
end;
$$;
