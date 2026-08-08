# @ogg/course-growth-site

The public website for **OGG Course Growth** — the B2B / done-for-you revenue-marketing side of
Oregon Golf Guide. Standalone marketing site (no auth, no backend) built with the same tooling
conventions as `packages/web-app` (Vite + React 19 + TypeScript + Tailwind 4), but with its own
design system distinct from the consumer Golfable brand elsewhere in this monorepo.

Business strategy behind this site — positioning, pricing, guarantee, SOPs, sales scripts,
capacity model — lives in [`docs/course-growth/`](../../docs/course-growth/README.md).

## Pages

Home · How It Works · 6-Week Buildout · What's Included · Guarantee · Results (case-study
placeholder) · About · FAQ · Apply/Book a Call · Contact

## Develop

```
npm install
npm run dev --workspace=@ogg/course-growth-site
```

## Build

```
npm run build --workspace=@ogg/course-growth-site
```

## Known gaps before real launch

- `src/pages/Apply.tsx` is presentational only — wire the submit handler to a real form backend
  (hosted form endpoint or a small serverless function) before going live.
- Fonts use a system serif/sans stack for zero-dependency launch speed; swap in licensed brand
  fonts via `@font-face` in `src/index.css` (same pattern as `packages/web-app`) once chosen.
- Contact details in `src/pages/Contact.tsx` are placeholders.
- The Results page is a template until the first client completes a 90-day measurement window —
  fill it in using `docs/course-growth/templates/case-study-template.md`.
