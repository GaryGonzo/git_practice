-- Tune notification titles to match how each role actually experiences the
-- app: the recipient of a new request/task is always "receiving" something,
-- and a reward redemption is specifically the other partner's event, so
-- naming their role reads more naturally than a generic "Reward redeemed".

create or replace function notify_new_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.assigned_to != new.requested_by then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, request_id)
    values (
      new.household_id,
      new.assigned_to,
      new.requested_by,
      'request_created',
      'You have a request',
      coalesce((select label from perk_catalog where key = new.perk_key), new.custom_label),
      new.id
    );
  end if;
  return new;
end;
$$;

create or replace function notify_new_task()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.assigned_to is not null and new.assigned_to != new.created_by then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, task_id)
    values (new.household_id, new.assigned_to, new.created_by, 'task_created', 'New to-do item', new.title, new.id);
  end if;
  return new;
end;
$$;

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
  else
    insert into notifications (household_id, recipient_id, kind, title, body)
    values (new.household_id, new.member_id, 'bonus_points', 'Bonus points!', new.reason);
  end if;
  return new;
end;
$$;
