-- Individual member billing. Price isn't chosen by the member -- it's
-- determined once, permanently, by a global signup sequence: the first 100
-- individual signups are free forever, then price steps up in cohorts
-- (101-500 at $7.99/mo, 501-1000 at $14.99/mo, 1001+ at $19.99/mo). A
-- studio member never gets a cohort assigned -- they're covered by their
-- studio's flat fee, not billed individually.
--
-- The cohort number comes from a Postgres sequence rather than a row count,
-- so two people signing up at the same instant can never land on the same
-- slot -- nextval() is atomic where counting existing rows wouldn't be.

create sequence individual_member_sequence;

alter table profiles add column individual_cohort_number integer;
alter table profiles add column individual_tier text
  check (individual_tier in ('free', 'tier_799', 'tier_1499', 'tier_1999'));
alter table profiles add column stripe_customer_id text;
alter table profiles add column stripe_subscription_id text;
alter table profiles add column subscription_status text;

create unique index profiles_stripe_customer_id_idx on profiles (stripe_customer_id) where stripe_customer_id is not null;
create unique index profiles_stripe_subscription_id_idx on profiles (stripe_subscription_id) where stripe_subscription_id is not null;

-- Assigns (once) and returns this member's individual pricing tier. Returns
-- null for a studio member -- they're covered by their studio's flat fee
-- and never need one. Safe to call repeatedly: returns the existing
-- assignment on every call after the first, so re-running it after a
-- member later joins or leaves a studio never reassigns a locked-in tier.
create or replace function assign_individual_tier(target_user_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  existing_tier text;
  is_studio_member boolean;
  cohort_number integer;
  new_tier text;
begin
  if auth.uid() != target_user_id then
    raise exception 'not authorized';
  end if;

  select individual_tier, (studio_id is not null) into existing_tier, is_studio_member
  from profiles where id = target_user_id;

  if existing_tier is not null then
    return existing_tier;
  end if;

  if is_studio_member then
    return null;
  end if;

  cohort_number := nextval('individual_member_sequence');

  new_tier := case
    when cohort_number <= 100 then 'free'
    when cohort_number <= 500 then 'tier_799'
    when cohort_number <= 1000 then 'tier_1499'
    else 'tier_1999'
  end;

  update profiles
  set individual_cohort_number = cohort_number, individual_tier = new_tier
  where id = target_user_id;

  return new_tier;
end;
$$;

grant execute on function assign_individual_tier(uuid) to authenticated;
