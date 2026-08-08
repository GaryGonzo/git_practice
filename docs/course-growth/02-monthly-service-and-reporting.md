# Ongoing Monthly Service, Scope of Work & Reporting

## 1. The four pillars (recap)

1. **Grow The Audience** — owned email/SMS database growth.
2. **Get Golfers Back** — repeat rounds, reactivation of lapsed golfers.
3. **Increase Customer Value** — memberships, passes, tournaments, leagues, F&B, lessons,
   merchandise, gift cards.
4. **Fill Perishable Inventory** — slow weekdays, twilight, open weekend inventory, good-weather
   opportunities, last-minute availability, post-aerification, shoulder-season demand.

## 2. Monthly deliverables (Scope of Work)

| Deliverable | Standard cadence | Pillar(s) |
|---|---|---|
| Email campaigns | 4–6/month | All |
| SMS campaigns | 2–4/month, only where SMS is enabled/appropriate | Fill Inventory, Get Golfers Back |
| Monthly promotional calendar | 1/month, delivered by the 25th of the prior month | All |
| Automated flow management (the 12 standard flows) | Ongoing monitoring + seasonal content refresh | All |
| Database growth management | Ongoing (popup performance, QR capture points, list hygiene) | Grow The Audience |
| Segmentation maintenance | Reviewed monthly, rebuilt quarterly | All |
| Reactivation campaigns | Always-on flows + 1–2 dedicated seasonal pushes/quarter | Get Golfers Back |
| Tee-time inventory campaigns | Woven into weekly/monthly send calendar | Fill Inventory |
| Membership/pass marketing | Seasonal pushes per calendar (heaviest Feb–April, Nov–Dec) | Increase Customer Value |
| Tournament/outing/league marketing support | Per client's season and the calendar | Increase Customer Value |
| Revenue attribution & reporting | 1 dashboard/month, delivered by the 5th business day | All |
| Quarterly strategy review | 1 call/quarter, 30 minutes | All |

## 3. Explicitly out of scope

Stated in the contract and on the website so there is no ambiguity:

- **Daily/organic social media management** — we may supply 2–4 ready-to-post assets/month
  pulled from the campaign content, but we do not manage the course's social accounts, respond to
  comments, or post daily.
- **Photography or video production** — referral to a local partner only; not resold or managed.
- **Full website redesign or rebuild** — we install/optimize lead capture and, if purchased, the
  Website Conversion add-on; we do not rebuild the site.
- **Customer support** — golfer-facing support (booking issues, refunds, complaints) stays with
  the course.
- **From-scratch graphic design on every campaign** — campaigns are built from the reusable
  content library (`06-operations-and-sops.md`) and lightly customized; a request for a fully
  bespoke, from-zero design on a single campaign is a change order, not standard scope.
- **Unlimited revision rounds** — 2 rounds of revisions per asset are included; additional rounds
  billed at $75/round or absorbed at our discretion for account health, never contractually owed.
- **Constant/ad hoc meetings** — one scheduled monthly touchpoint (can be async via the report)
  plus the quarterly review call. Additional meetings are welcome but not guaranteed on-demand.
- **Paid media management** — add-on only ($500/mo + ad spend), sold starting month 3+.

## 4. Approval cadence

One working touchpoint per month, structured to respect the GM's time:
- Calendar delivered by the 25th of the prior month → GM has 3 business days to flag conflicts
  (silence = approved).
- Individual campaigns follow the async email/SMS approval process in
  `06-operations-and-sops.md` — no live meeting required unless the client requests one.

---

## 5. The monthly reporting dashboard

**Design rule: a GM or owner must be able to read it in under two minutes.** One page. Revenue
and ROI at the top, supporting metrics below, opens/clicks last and small.

### Section 1 — The headline (top of page, large type)

```
Monthly attributable revenue:      $12,400
Management fee:                    $2,000
Return:                            6.2X
```

### Section 2 — Revenue detail (still above the fold)

- Bookings generated (with revenue where attributable)
- Membership/pass leads generated → purchases closed → revenue
- Gift card revenue driven
- Lapsed golfers reactivated (count + estimated revenue using course's average round value)
- Tournament/outing leads generated

### Section 3 — Growth & health (supporting, smaller)

- Database growth this month (net new subscribers, list size)
- Emails sent / SMS sent
- Segment health snapshot (e.g., lapsed-90 segment shrinking or growing)

### Section 4 — Supporting metrics only (smallest section, clearly labeled "supporting metrics —
not the focus")

- Email open rate, click rate
- SMS click rate
- Popup conversion rate

### What is deliberately excluded or de-emphasized
- Social media follower counts, likes, impressions — never on this dashboard.
- "Engagement" as a headline metric.
- Any metric without a plain-English revenue or database-health translation next to it.

Full field-by-field build spec (data sources, attribution method per metric, and the Looker
Studio/spreadsheet template) is in `templates/monthly-report-template.md`.

## 6. Revenue attribution method (standard, replicated per client)

Attribution is never claimed as more precise than the tools allow — see the eligibility and
"tracking capabilities are available" clause in `08-guarantee-legal.md`. Standard method, in order
of preference based on what the course's booking/POS system supports:

1. **Dedicated promo/booking codes per campaign** (best) — a unique code per email/SMS send,
   redeemed at booking or POS, revenue tied directly to the campaign.
2. **Dedicated tracking links / landing pages per campaign** — UTM-tagged links into GA4,
   booking-page-level conversion tracking where the tee-sheet vendor allows it.
3. **Platform-native revenue tracking** — where the ESP/CRM (e.g., Klaviyo with a connected
   e-commerce/booking integration) can natively attribute revenue to a specific send.
4. **Directional attribution** — where none of the above is technically available (common with
   some legacy tee-sheet systems with no API), we use before/after comparison on the specific
   inventory or offer being promoted (e.g., Tuesday twilight bookings in the 2 weeks after a
   twilight campaign vs. the 2 weeks before), clearly labeled as directional/estimated in the
   report, and never counted toward the contractual $2:$1 guarantee unless the client and we
   agree in writing to accept directional data for that measurement.

This tiered method is why the guarantee's eligibility terms require baseline tracking capability
to exist or be establishable in Week 6 — it is a shared input, not something we can conjure
without system access.
