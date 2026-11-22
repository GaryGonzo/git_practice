Golfable
========

Practice-anywhere golf training. Monorepo with two packages:

  packages/shared          Brand system, Drill schema and the drill library
                            (packages/shared/src/drillLibrary.ts), shared by
                            the web app and the database seed.

  packages/web-app         React + Tailwind skeleton for the planned paid
                            web app (Supabase auth/DB, Stripe billing,
                            deployed on Vercel).

Setup
-----
  npm install

Drill library
-------------
  Drills live in packages/shared/src/drillLibrary.ts (steps, targets per
  handicap band, where they can be done, and the animated scene). After
  editing, regenerate the seed and apply it as a migration:
    npx tsx supabase/seed/build-drill-seed.ts > supabase/migrations/<next>_drill_library.sql

Web app
-------
  cd packages/web-app
  cp .env.example .env.local   # fill in Supabase + Stripe keys
  npm run dev

  This is a skeleton: brand colors/fonts are wired into Tailwind, and
  Supabase/Stripe clients are stubbed out (packages/web-app/src/lib). Actual
  auth, drill delivery, scoring, and Stripe checkout still need to be built
  against a provisioned Supabase project. Stripe checkout session creation
  must happen server-side (a Supabase Edge Function) since it needs the
  secret key — never put that in the web app.
