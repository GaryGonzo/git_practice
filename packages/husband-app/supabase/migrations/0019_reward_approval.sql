-- The husband doesn't make "requests" the way the wife does -- his version
-- of asking for something is a reward. Anything already in the rewards
-- list ("preset") is claimable immediately by whoever has the points. A
-- brand-new reward idea he types in himself needs the wife's approval
-- before it's claimable; her own additions are pre-approved since she's
-- the one setting the preset in the first place.

alter table rewards add column status text not null default 'active' check (status in ('pending', 'active'));

create function set_reward_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  creator_role text;
begin
  select role into creator_role from profiles where id = new.created_by;
  if creator_role = 'husband' then
    new.status := 'pending';
  else
    new.status := 'active';
  end if;
  return new;
end;
$$;

create trigger on_reward_insert_set_status
  before insert on rewards
  for each row execute function set_reward_status();

create function approve_reward(target_reward_id uuid)
returns rewards
language plpgsql
security definer set search_path = public
as $$
declare
  updated_reward rewards;
  approver_role text;
begin
  select * into updated_reward from rewards where id = target_reward_id;
  if updated_reward.id is null then
    raise exception 'Reward not found';
  end if;
  if not is_household_member(updated_reward.household_id) then
    raise exception 'Not a member of this household';
  end if;

  select role into approver_role from profiles where id = auth.uid();
  if approver_role != 'wife' then
    raise exception 'Only the wife can approve a reward request';
  end if;

  update rewards set status = 'active' where id = target_reward_id
  returning * into updated_reward;

  return updated_reward;
end;
$$;

-- Belt-and-suspenders: redeem_reward also refuses a still-pending reward,
-- even if the client ever lets a claim attempt through.
create or replace function redeem_reward(target_reward_id uuid)
returns reward_redemptions
language plpgsql
security definer set search_path = public
as $$
declare
  target rewards;
  balance integer;
  new_redemption reward_redemptions;
begin
  select * into target from rewards where id = target_reward_id;
  if target.id is null then
    raise exception 'Reward not found';
  end if;
  if not is_household_member(target.household_id) then
    raise exception 'Not a member of this household';
  end if;
  if target.status != 'active' then
    raise exception 'This reward needs approval before it can be claimed';
  end if;

  select coalesce(sum(points), 0) into balance
  from points_ledger
  where household_id = target.household_id and member_id = auth.uid();

  if balance < target.point_cost then
    raise exception 'Not enough points -- % available, % needed', balance, target.point_cost;
  end if;

  insert into points_ledger (household_id, member_id, points, reason)
  values (target.household_id, auth.uid(), -target.point_cost, 'Redeemed: ' || target.label);

  insert into reward_redemptions (household_id, reward_id, redeemed_by, label, points_spent)
  values (target.household_id, target.id, auth.uid(), target.label, target.point_cost)
  returning * into new_redemption;

  return new_redemption;
end;
$$;

-- Lets the wife know there's a reward request waiting on her.
create function notify_reward_requested()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  other_member uuid;
begin
  if new.status = 'pending' then
    select user_id into other_member
    from household_members
    where household_id = new.household_id and user_id != new.created_by
    limit 1;
    if other_member is not null then
      insert into notifications (household_id, recipient_id, actor_id, kind, title, body)
      values (
        new.household_id,
        other_member,
        new.created_by,
        'reward_requested',
        'New reward request',
        new.label || ' -- ' || new.point_cost || ' pts'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger on_reward_created_notify
  after insert on rewards
  for each row execute function notify_reward_requested();

-- Lets the husband know his reward request got the green light.
create function notify_reward_approved()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'active' and old.status = 'pending' then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body)
    values (new.household_id, new.created_by, auth.uid(), 'reward_approved', 'Reward approved', new.label || ' is ready to claim');
  end if;
  return new;
end;
$$;

create trigger on_reward_approved_notify
  after update on rewards
  for each row execute function notify_reward_approved();
