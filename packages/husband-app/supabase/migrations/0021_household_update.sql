-- Households never had an update policy -- renaming one was never possible
-- from the client, even though members could already read it freely.

create policy "members can update their household"
  on households for update
  using (is_household_member(id));
