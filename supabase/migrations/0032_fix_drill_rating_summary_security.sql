-- drill_rating_summary (0030) came back from the security advisor as an
-- ERROR: a plain `create view` defaults to security_invoker = false on
-- Postgres 15+, meaning it runs with the view owner's privileges rather
-- than the querying user's, bypassing RLS on the tables it reads. The
-- underlying drill_ratings table is intentionally public-read, so nothing
-- was actually exposed that shouldn't be -- but fix it properly rather
-- than rely on that coincidence.

alter view drill_rating_summary set (security_invoker = true);
