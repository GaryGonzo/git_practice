-- One-time backfill: any request that's already marked "done" but has no
-- matching points_ledger row (either completed before complete_request()
-- existed, or hit some other failure along the way) gets credited now.
-- Safe to re-run -- the "not exists" guard means it only ever fills gaps,
-- never double-credits a request that already has a ledger entry.

insert into points_ledger (household_id, member_id, points, reason, request_id)
select
  r.household_id,
  r.assigned_to,
  r.points,
  coalesce((select label from perk_catalog where key = r.perk_key), r.custom_label),
  r.id
from requests r
where r.status = 'done'
  and not exists (select 1 from points_ledger pl where pl.request_id = r.id);
