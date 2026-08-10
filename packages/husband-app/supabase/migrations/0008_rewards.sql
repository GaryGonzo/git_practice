-- Rewards: a shared catalog either partner can add to (innocent or
-- otherwise -- "make a sandwich" and "naughty picture" are the same kind of
-- row, just a different point cost), redeemed against whatever points
-- you've earned in points_ledger.
create table rewards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid not null references profiles (id),
  label text not null,
  emoji text not null default '🎁',
  point_cost smallint not null check (point_cost > 0),
  created_at timestamptz not null default now()
);

create index rewards_household_idx on rewards (household_id);

alter table rewards enable row level security;

create policy "members can read household rewards"
  on rewards for select
  using (is_household_member(household_id));

create policy "members can create rewards in their household"
  on rewards for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update rewards in their household"
  on rewards for update
  using (is_household_member(household_id));

create policy "members can delete rewards in their household"
  on rewards for delete
  using (is_household_member(household_id));

-- Snapshots the label/cost at redemption time so editing or deleting a
-- reward later never rewrites history.
create table reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  reward_id uuid references rewards (id) on delete set null,
  redeemed_by uuid not null references profiles (id),
  label text not null,
  points_spent smallint not null,
  created_at timestamptz not null default now()
);

create index reward_redemptions_household_idx on reward_redemptions (household_id, redeemed_by);

alter table reward_redemptions enable row level security;

create policy "members can read household redemptions"
  on reward_redemptions for select
  using (is_household_member(household_id));

-- All inserts happen via redeem_reward() (security definer) below, so the
-- points ledger and redemption record can never drift apart.

create function redeem_reward(target_reward_id uuid)
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

-- A negative points_ledger row is a redemption, not an award -- let the
-- other household member know what got redeemed instead of the "Bonus
-- points!" framing meant for positive entries.
create or replace function notify_points_awarded()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  task_creator uuid;
  other_member uuid;
begin
  if new.points < 0 then
    select user_id into other_member
    from household_members
    where household_id = new.household_id and user_id != new.member_id
    limit 1;
    if other_member is not null then
      insert into notifications (household_id, recipient_id, actor_id, kind, title, body)
      values (new.household_id, other_member, new.member_id, 'reward_redeemed', 'Reward redeemed', new.reason);
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
