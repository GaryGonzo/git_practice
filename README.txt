Golfable
========

Daily golf skill challenge platform. Monorepo with three packages:

  packages/shared          Brand system + Drill schema (TypeScript types),
                            shared by both packages below.

  packages/card-generator  Renders the 3-card format (Setup, Rules & Scoring,
                            Targets) for a drill from a JSON data file to
                            310x388px PNGs, ready to post to TikTok.

  packages/web-app         React + Tailwind skeleton for the planned paid
                            web app (Supabase auth/DB, Stripe billing,
                            deployed on Vercel).

Setup
-----
  npm install

Card generator
--------------
  Add a drill: copy packages/card-generator/drills/_template.json to
  <slug>.json and fill in setup/rules/targets copy.

  Render all drills in packages/card-generator/drills/ to PNGs:
    npm run cards:render

  Output goes to packages/card-generator/output/<drill-id>/{1-setup,
  2-rules-scoring,3-targets}.png (gitignored). Brand fonts (Bebas Neue,
  Barlow Condensed, Barlow) are self-hosted under
  packages/card-generator/assets/fonts so rendering doesn't depend on an
  external font CDN at screenshot time.

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
