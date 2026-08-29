-- Challenges had no way to be canceled -- a creator whose invitee never
-- responds was stuck with it sitting in their list forever. Add a delete
-- policy for the creator; challenge_participants cascades on delete
-- automatically (0020), so canceling cleans up any joiners too.

create policy "creator can cancel their own challenge"
  on challenges for delete
  using (auth.uid() = creator_id);
