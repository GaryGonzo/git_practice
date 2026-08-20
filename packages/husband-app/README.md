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

## Push notifications

Real Web Push (a notification that shows up even when the app isn't open) needs a few pieces
beyond the app code itself:

1. **VITE_VAPID_PUBLIC_KEY** — added as a Vercel environment variable (Production + Preview),
   same place as the Supabase ones. The `VITE_` prefix is required -- Vite only bundles
   env vars into the client build if the name starts with it, so `VAPID_PUBLIC_KEY` (no
   prefix) silently does nothing here even though it's a valid Supabase secret name.
2. **`send-push` Edge Function** (`supabase/functions/send-push`) — deployed in the Supabase
   dashboard under Edge Functions. **Disable JWT verification** for this function specifically —
   it's only ever called by Supabase's own Database Webhook, never by end users.
3. **Edge Function secrets** — `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a
   `mailto:` address), set under that function's settings. `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` are provided automatically by Supabase, no need to set those.
4. **Database Webhook** — Database → Webhooks → new webhook on `notifications`, event
   `INSERT`, target the `send-push` Edge Function. This is what actually fires a push every time
   the existing in-app notification triggers create a row.

On iPhone, installed-to-Home-Screen is a hard requirement — Safari tabs never receive real push
notifications, only PWAs added via Share → Add to Home Screen.
