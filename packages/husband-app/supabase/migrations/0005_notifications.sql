-- In-app alerts: a request comes in, a task gets knocked out, bonus points
-- land -- the other partner sees it live via Supabase Realtime while the
-- app is open. No push infrastructure; this is purely in-app.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  kind text not null,
  title text not null,
  body text,
  request_id uuid references requests (id) on delete set null,
  task_id uuid references tasks (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "members can read their own notifications"
  on notifications for select
  using (recipient_id = auth.uid());

create policy "members can mark their own notifications read"
  on notifications for update
  using (recipient_id = auth.uid());

-- All inserts happen via the trigger functions below (security definer) --
-- no direct insert policy.

create function notify_new_request()
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
      'New request',
      coalesce((select label from perk_catalog where key = new.perk_key), new.custom_label),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_request_created
  after insert on requests
  for each row execute function notify_new_request();

create function notify_request_done()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' and new.requested_by != new.assigned_to then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, request_id)
    values (
      new.household_id,
      new.requested_by,
      new.assigned_to,
      'request_done',
      'Request done',
      coalesce((select label from perk_catalog where key = new.perk_key), new.custom_label),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_request_status_changed
  after update on requests
  for each row execute function notify_request_done();

create function notify_new_task()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.assigned_to is not null and new.assigned_to != new.created_by then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, task_id)
    values (new.household_id, new.assigned_to, new.created_by, 'task_created', 'New task', new.title, new.id);
  end if;
  return new;
end;
$$;

create trigger on_task_created
  after insert on tasks
  for each row execute function notify_new_task();

-- Fires for both task completions (via complete_task()) and manual bonus
-- points (via award_bonus_points()), since both insert into points_ledger.
create function notify_points_awarded()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  task_creator uuid;
begin
  if new.task_id is not null then
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

create trigger on_points_awarded
  after insert on points_ledger
  for each row execute function notify_points_awarded();

alter publication supabase_realtime add table notifications;
