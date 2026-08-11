-- Requests never actually carried a points value -- "tier" is just a
-- qualitative size label. This adds real points to requests, mirroring how
-- tasks already work: a value is chosen (and remembered per label via
-- custom_ask_templates) when the request is created, copied onto the row so
-- it stays locked in even if the remembered default changes later, and
-- awarded to the assignee via complete_request() when it's marked done.

alter table requests add column points smallint not null default 5;
alter table points_ledger add column request_id uuid references requests (id) on delete set null;

create or replace function complete_request(target_request_id uuid)
returns requests
language plpgsql
security definer set search_path = public
as $$
declare
  updated_request requests;
begin
  select * into updated_request from requests where id = target_request_id;
  if updated_request.id is null then
    raise exception 'Request not found';
  end if;
  if not is_household_member(updated_request.household_id) then
    raise exception 'Not a member of this household';
  end if;
  if updated_request.status = 'done' then
    return updated_request;
  end if;

  update requests set status = 'done', completed_at = now()
  where id = target_request_id
  returning * into updated_request;

  insert into points_ledger (household_id, member_id, points, reason, request_id)
  values (
    updated_request.household_id,
    updated_request.assigned_to,
    updated_request.points,
    coalesce((select label from perk_catalog where key = updated_request.perk_key), updated_request.custom_label),
    updated_request.id
  );

  return updated_request;
end;
$$;

-- A request-linked ledger row is already covered by the existing
-- "Request done" notification (fired by the status-change trigger), so this
-- just needs to not fall through to the generic "Bonus points!" branch.
create or replace function notify_points_awarded()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  task_creator uuid;
  other_member uuid;
  redeemer_role text;
begin
  if new.points < 0 then
    select user_id into other_member
    from household_members
    where household_id = new.household_id and user_id != new.member_id
    limit 1;
    if other_member is not null then
      select role into redeemer_role from profiles where id = new.member_id;
      insert into notifications (household_id, recipient_id, actor_id, kind, title, body)
      values (
        new.household_id,
        other_member,
        new.member_id,
        'reward_redeemed',
        case redeemer_role
          when 'husband' then 'Your husband wants to redeem a reward'
          when 'wife' then 'Your wife wants to redeem a reward'
          else 'Reward redeemed'
        end,
        new.reason
      );
    end if;
  elsif new.task_id is not null then
    select created_by into task_creator from tasks where id = new.task_id;
    if task_creator is not null and task_creator != new.member_id then
      insert into notifications (household_id, recipient_id, actor_id, kind, title, body, task_id)
      values (new.household_id, task_creator, new.member_id, 'task_done', 'Task done', new.reason, new.task_id);
    end if;
  elsif new.request_id is not null then
    null; -- already covered by the request status-change notification
  else
    insert into notifications (household_id, recipient_id, kind, title, body)
    values (new.household_id, new.member_id, 'bonus_points', 'Bonus points!', new.reason);
  end if;
  return new;
end;
$$;

-- Lets the requester correct a request's point value while it's still
-- pending/in-progress -- and keeps the remembered template default (used
-- to prefill future requests with the same label) in sync with it.
create or replace function update_request_points(target_request_id uuid, new_points smallint)
returns requests
language plpgsql
security definer set search_path = public
as $$
declare
  updated_request requests;
begin
  select * into updated_request from requests where id = target_request_id;
  if updated_request.id is null then
    raise exception 'Request not found';
  end if;
  if updated_request.requested_by != auth.uid() then
    raise exception 'Only the requester can edit this request''s points';
  end if;
  if updated_request.status in ('done', 'cancelled', 'declined') then
    raise exception 'Can''t edit points on a finished request';
  end if;
  if new_points <= 0 then
    raise exception 'Points must be greater than zero';
  end if;

  update requests set points = new_points where id = target_request_id returning * into updated_request;

  update custom_ask_templates
  set points = new_points
  where household_id = updated_request.household_id
    and kind = 'request'
    and label = coalesce((select label from perk_catalog where key = updated_request.perk_key), updated_request.custom_label);

  return updated_request;
end;
$$;
