-- Only the husband earns points in this economy -- wives assign/request,
-- husbands complete and get credited. Nothing previously enforced that:
-- an unassigned task defaulted to whoever completed it, and bonus points
-- could be aimed at either partner. Both task/request completion and
-- bonus points now always resolve to the household's husband, regardless
-- of who was assigned or who the bonus was aimed at.

create or replace function complete_task(target_task_id uuid)
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

  select p.id into awardee
  from household_members hm
  join profiles p on p.id = hm.user_id
  where hm.household_id = updated_task.household_id and p.role = 'husband'
  limit 1;
  if awardee is null then
    awardee := coalesce(updated_task.assigned_to, auth.uid());
  end if;

  update tasks set status = 'done', completed_at = now()
  where id = target_task_id
  returning * into updated_task;

  insert into points_ledger (household_id, member_id, points, reason, task_id)
  values (updated_task.household_id, awardee, updated_task.points, updated_task.title, updated_task.id);

  return updated_task;
end;
$$;

create or replace function complete_request(target_request_id uuid)
returns requests
language plpgsql
security definer set search_path = public
as $$
declare
  updated_request requests;
  awardee uuid;
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

  select p.id into awardee
  from household_members hm
  join profiles p on p.id = hm.user_id
  where hm.household_id = updated_request.household_id and p.role = 'husband'
  limit 1;
  if awardee is null then
    awardee := updated_request.assigned_to;
  end if;

  update requests set status = 'done', completed_at = now()
  where id = target_request_id
  returning * into updated_request;

  insert into points_ledger (household_id, member_id, points, reason, request_id)
  values (
    updated_request.household_id,
    awardee,
    updated_request.points,
    coalesce((select label from perk_catalog where key = updated_request.perk_key), updated_request.custom_label),
    updated_request.id
  );

  return updated_request;
end;
$$;

create or replace function award_bonus_points(target_household_id uuid, target_member_id uuid, bonus_points integer, bonus_reason text)
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
  if not exists (select 1 from profiles where id = target_member_id and role = 'husband') then
    raise exception 'Bonus points can only be awarded to the husband';
  end if;

  insert into points_ledger (household_id, member_id, points, reason)
  values (target_household_id, target_member_id, bonus_points, bonus_reason)
  returning * into new_row;

  return new_row;
end;
$$;
