# Capacity Model, Hiring Roadmap & Tech Stack

## Part 1 — Capacity model

### Labor assumptions (per client)
- **Buildout (weeks 1–6, new client only):** ~35 hours total (~6/week)
- **Steady-state monthly management:** ~5–6 hours/month (campaign builds ~2.5h, QA/approval
  ~1h, reporting ~1h, segmentation/reactivation upkeep ~1–1.5h), plus ~0.5h/month amortized for
  quarterly review calls
- These numbers assume the 80/20 standardization principle holds — they break down if every
  client demands bespoke creative or off-template work, which is why scope discipline
  (`02-monthly-service-and-reporting.md` §3) is a capacity issue, not just a pricing issue.

### Model by client count (steady-state, i.e., not actively onboarding a wave of new clients)

| Clients | Monthly revenue | Ongoing labor hrs/mo | Concurrent buildout capacity | Team needed | Approx. gross margin* |
|---|---|---|---|---|---|
| 5 | $10,000 | ~28–30 | 1 new client/month comfortably | Solo | ~90%+ |
| 10 | $20,000 | ~55–60 | 1 new client/month, tight in buildout weeks | Solo, at capacity | ~85–90% |
| 15 | $30,000 | ~85–90 | Needs a hire to sustain | Owner + 1 (Campaign Ops Specialist) | ~70–75% |
| 25 | $50,000 | ~140–150 | Needs 2 on execution | Owner + 2 (or 1 FT + 1 PT) | ~65–72% |

*Gross margin excludes owner's own compensation/draw at the 5–10 client stage (that labor is the
owner); once staff are hired, their fully-loaded cost is treated as COGS and margin is calculated
against actual cash costs (software + payroll).

### Reading the model
- **5 clients** is a comfortable side-of-desk or early-stage solo operation — plenty of slack for
  sales, admin, and even a second job during ramp-up.
- **10 clients is the target solo ceiling** stated in the brief. At ~55–60 hours/month of
  client-execution work plus sales, admin, and software/ops management, this is a genuine
  full-time solo workload — realistic, but with little slack for a bad month (e.g., 2 clients
  onboarding simultaneously). Treat 10 as "full," not "comfortable."
- **15 clients requires the first hire** before signing client #11–12, not after — bringing
  someone on *after* the operator is already overwater causes quality slippage exactly when
  the guarantee is being measured on newer accounts. Target hiring trigger: **signed client #9–10**
  (hire during the buildout of #9/#10 so the new hire ramps on templated buildout work first).
- **25 clients** needs a second execution hire or a lead + junior structure; owner shifts
  further from execution into sales, QA oversight, and account strategy for the highest-value
  relationships.

### First hire: role and reasoning
**Title:** Campaign Operations Specialist (or "Marketing Coordinator")
**Why this role first (not a salesperson, not a strategist):** the bottleneck at 10–15 clients is
execution hours on templated work — building campaigns from the library, QA, scheduling,
pulling report data — not judgment. This is a trainable, template-driven role, which is exactly
what the 80/20 system is built to support. A junior hire can be productive within 2–3 weeks
against the SOPs in `06-operations-and-sops.md`.
**What stays with the owner regardless of scale:** sales and business development, final
guarantee/reporting sign-off, client relationship ownership for at-risk or high-value accounts,
quarterly strategy reviews, offer/pricing/guarantee decisions, contracts, hiring, and OGG brand
strategy.
**Compensation ballpark (Oregon market, remote-friendly):** $24–30/hr part-time (20–25 hrs/wk) to
start, converting to a $48–55k salaried role once past ~15 clients.

---

## Part 2 — Tech stack

### Principle: standardize our internal workflow, not every client's tech
Forcing every course onto one ESP breaks courses that already have a working, paid-for platform
(and creates unnecessary migration risk/downtime). Instead:

- **Client-owned systems, we operate inside them:** the course keeps and pays for its own
  ESP/SMS platform account (Klaviyo, Mailchimp, or Campaign Monitor — whichever it already has
  or, if starting fresh, our recommended default). We work as a user/manager inside their
  account. This keeps their data theirs (important for trust and for a clean offboarding if the
  relationship ever ends), keeps our own software costs largely fixed regardless of client count,
  and matches the "don't force one ESP" requirement directly.
- **Our default recommendation for a course with nothing in place:** Klaviyo (best-in-class
  automation/segmentation and now the closest thing to a category standard for
  revenue-attributed email/SMS; agency multi-account management is mature). Mailchimp is an
  acceptable fallback for very small/low-budget courses. HubSpot and Campaign Monitor are kept
  in mind for the rare client that already runs one — we work inside it rather than migrating.
- **Internal tools (fixed cost regardless of client count, scales only with headcount):**
  - Task management: Notion or Asana (Notion default — cheaper, flexible enough for the client
    folder + task template structure in `06-operations-and-sops.md`)
  - Automation/integration glue: Zapier or Make, for connecting booking/POS exports into ESPs
    where no native integration exists
  - Analytics: Google Analytics 4 (per client, in their own property) + Looker Studio for the
    monthly dashboard build (free, client-brandable, exportable to PDF)
  - Scheduling: Calendly (sales calls, audit calls, quarterly reviews)
  - Payments/billing: Stripe (client invoicing/subscription billing for the $2,000/mo fee)
  - Workspace: Google Workspace (email, docs, shared drives per the client folder structure)
  - Design: Canva Pro (fast templated asset customization — matches the "not from-scratch every
    time" scope boundary) or Figma if the operator prefers a more structured template system

### Golf-specific systems to integrate around (not replace)
GolfNow, Golf365, ForeUp, Lightspeed Golf, Jonas, Chronogolf, EZLinks, club-in-house systems.
**None of these should be replaced or migrated as part of this service** — we integrate with
whatever the course already runs.

### Known API/integration limitations (flag these honestly, they affect attribution)
- Several legacy tee-sheet systems (older Jonas/EZLinks deployments especially) have limited or
  no public API — export may be manual CSV only, which limits real-time automation triggers
  (e.g., a true "post-round" trigger becomes a daily batch import instead of instant).
- Not all POS systems expose email/phone capture cleanly to export — some require a manual
  data-hygiene pass in Week 3 rather than a clean automated sync.
- Promo-code redemption tracking depends entirely on whether the booking/POS system can tag a
  booking with a code and report it back — some can't, which is why attribution tier 4
  ("directional") exists in `02-monthly-service-and-reporting.md` and is explicitly excluded from
  counting toward the guarantee unless both sides agree to accept it.
- SMS carrier registration (10DLC) can take 1–3 weeks to clear — factor this into Week 6 launch
  planning; SMS may go live slightly after email if registration is initiated late.

These limitations are a client-onboarding conversation, not a surprise found later — the Week 1
audit call specifically screens for them.
