# The Husband App

A couples app for requests, honey-do tasks, points, and rewards. React + Vite + Supabase.

## Local development

```
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Database

Migrations live in `supabase/migrations`, run in order via the Supabase dashboard SQL Editor.

## Deployment

This project is connected to Vercel via Git integration (Project Settings → Git in the Vercel
dashboard, under team `golfable`, project `the-husband-app`):

- **Root Directory:** `packages/husband-app`
- **Production Branch:** `claude/husband-app-altetc`
- **Environment variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are set directly in
  Vercel's Environment Variables settings, not committed to this repo.

Pushing a commit that touches files under this folder triggers an automatic production deploy.
Vercel skips the build entirely if a push doesn't touch anything under `packages/husband-app`
(shows up as a "Canceled" deployment with reason "this project was not affected" — that's expected
for monorepo pushes elsewhere in the repo, not an error).
