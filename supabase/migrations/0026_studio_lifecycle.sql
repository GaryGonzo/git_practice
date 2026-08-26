-- Studio membership lifecycle: cancelling a studio (the partnership ends)
-- or a member leaving one voluntarily. Both end the same way -- the
-- member's studio_id is cleared and they fall back to individual billing
-- next time assign_individual_tier runs for them.

alter table studios add column canceled_at timestamptz;

-- Lock down self-service profile updates to genuinely safe columns.
-- "users can update their own profile" (0001_init.sql) has no column
-- restriction, so any authenticated user can currently set is_admin,
-- studio_id, individual_tier, or their Stripe linkage on themselves
-- directly by calling supabase.from("profiles").update(...) from the
-- client -- verified exploitable (RLS only checks *which row*, not
-- *which columns*). Billing/access-control columns now only move through
-- security-definer RPCs or service-role API routes, which is the only
-- change here -- no client code path relies on writing them any other way.
-- (avatar_path isn't included -- 0017_avatar_upload.sql was never actually
-- applied to this database, so that column doesn't exist yet.)
revoke update on profiles from authenticated;
grant update (first_name, last_name, tier, weekly_goal, has_seen_walkthrough, marketing_opt_in)
  on profiles to authenticated;

-- A member leaving their studio on their own initiative. No Stripe call
-- needed here -- studio members aren't billed while covered (their
-- individual subscription, if any, was already canceled when they
-- joined), so there's nothing to stop. They're walked through checkout
-- again next time they open Profile, same as any other unpaid member.
create or replace function leave_studio()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update profiles set studio_id = null where id = auth.uid();
end;
$$;

grant execute on function leave_studio() to authenticated;

-- Admin cancels a studio (the partnership ended): mark it canceled and
-- drop every member's studio_id, same effect as if each of them left
-- individually. The studio row itself is kept for history.
create or replace function cancel_studio(target_studio_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true) then
    raise exception 'not authorized';
  end if;

  update studios set canceled_at = now() where id = target_studio_id;
  update profiles set studio_id = null where studio_id = target_studio_id;
end;
$$;

grant execute on function cancel_studio(uuid) to authenticated;

-- A site admin can now also pull any studio's roster, not just that
-- studio's own owner -- needed so the admin dashboard can show which
-- members belong to which studio, not just an aggregate count.
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
  if not exists (
    select 1 from studios
    where studios.id = target_studio_id
    and (
      studios.owner_user_id = auth.uid()
      or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
    )
  ) then
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
