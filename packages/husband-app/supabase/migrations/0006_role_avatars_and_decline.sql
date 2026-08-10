-- Role-appropriate default avatars (wife/husband emoji instead of a generic
-- one), and a decline path for both requests and tasks -- distinct from
-- "cancelled" (the requester backing out): "declined" is the assignee
-- saying no, optionally with a reason ("already left for work").

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'role',
    case new.raw_user_meta_data ->> 'role'
      when 'wife' then '👰'
      when 'husband' then '🤵'
      else '🙂'
    end
  );
  return new;
end;
$$;

alter table requests drop constraint requests_status_check;
alter table requests add constraint requests_status_check
  check (status in ('pending', 'in_progress', 'done', 'cancelled', 'declined'));
alter table requests add column decline_note text;

alter table tasks drop constraint tasks_status_check;
alter table tasks add constraint tasks_status_check
  check (status in ('open', 'in_progress', 'done', 'declined'));
alter table tasks add column decline_note text;

create function decline_request(target_request_id uuid, note text default null)
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

  update requests set status = 'declined', decline_note = note
  where id = target_request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

create function decline_task(target_task_id uuid, note text default null)
returns tasks
language plpgsql
security definer set search_path = public
as $$
declare
  updated_task tasks;
begin
  select * into updated_task from tasks where id = target_task_id;
  if updated_task.id is null then
    raise exception 'Task not found';
  end if;
  if not is_household_member(updated_task.household_id) then
    raise exception 'Not a member of this household';
  end if;

  update tasks set status = 'declined', decline_note = note
  where id = target_task_id
  returning * into updated_task;

  return updated_task;
end;
$$;

-- Notify the requester/creator when their thing gets declined.
create function notify_request_declined()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'declined' and old.status is distinct from 'declined' and new.requested_by != new.assigned_to then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, request_id)
    values (
      new.household_id,
      new.requested_by,
      new.assigned_to,
      'request_declined',
      'Request declined',
      coalesce(new.decline_note, coalesce((select label from perk_catalog where key = new.perk_key), new.custom_label)),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_request_declined
  after update on requests
  for each row execute function notify_request_declined();

create function notify_task_declined()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'declined' and old.status is distinct from 'declined' and new.created_by != new.assigned_to then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, task_id)
    values (
      new.household_id,
      new.created_by,
      new.assigned_to,
      'task_declined',
      'Task declined',
      coalesce(new.decline_note, new.title),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_task_declined
  after update on tasks
  for each row execute function notify_task_declined();
