-- 0017_avatar_upload.sql (avatar_path column + storage bucket) was written
-- but never actually applied to this database -- avatar upload has been
-- silently broken in production. Applied for real as part of this
-- migration set. avatar_path was left out of 0026_studio_lifecycle.sql's
-- column-level grant lockdown because the column didn't exist yet at that
-- point; add it now so members can self-update their own avatar again.
grant update (avatar_path) on profiles to authenticated;
