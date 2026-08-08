# The 6-Week Course Revenue Buildout

Standardized onboarding process for every new client. Goal: by the end of week 6, the course has
a live database-growth engine, a segmented list, running automations, an approved 12-month
calendar, and a working revenue dashboard — and we have everything needed to run the account
on a repeatable monthly cadence starting month 2.

Internal budget: ~6–8 hours/week of operator time per new client during buildout (see
`07-capacity-hiring-tech-stack.md` for how this caps concurrent buildouts).

---

## Week 1 — Revenue Audit

**Goal:** Document exactly what the course has today so nothing downstream is guessed.

Deliverable: a filled-out copy of `templates/revenue-audit-template.md`, reviewed live with the
GM/Director of Golf in a 30-minute call, becoming the single source of truth for the account.

Audit covers:
- Website (platform, mobile experience, booking flow, page speed, existing popups/forms)
- Tee-time booking system (GolfNow, ForeUp, Lightspeed, Jonas, Chronogolf, club-in-house, etc.)
- POS / customer database (what's captured, where it lives, export capability)
- Email database (size, source, last-cleaned date, current open/click rates if any)
- SMS capability (opted-in numbers, current tool if any, carrier registration status)
- Existing email platform (Mailchimp, Constant Contact, none, etc.) and whether to keep or migrate
- Membership / annual pass offerings (tiers, pricing, current renewal process)
- League programs (which leagues, season structure, registration process)
- Tournament / outings program (corporate outings, charity events, member-guest, city tournament)
- Lessons (instructor(s), booking method, current promotion if any)
- Driving range (bucket pricing, membership, current utilization patterns if known)
- Restaurant / F&B (hours, current promotion, banquet/event space)
- Merchandise (pro shop POS, online store if any)
- Gift cards (physical/digital, current sales volume if known)
- Existing promotions (twilight rates, senior/junior rates, weekday specials)
- Social presence (platforms, posting cadence, follower counts — for context only, not a KPI)
- Website traffic (GA4 if installed; if not, flag as a Week 6 setup item)
- Current lead capture (forms, popups, none)
- Existing automations (any welcome emails, abandoned booking flows, etc.)
- Customer acquisition channels (organic search, GolfNow/marketplace listings, referral, local
  partnerships, paid if any)
- Current revenue benchmarks (rounds/year if shareable, average green fee, membership count,
  F&B attach rate if known — used only as a baseline for the 90-day guarantee, never published)

**Output of Week 1:** a completed Revenue Audit doc + a short "Findings & Priorities" memo (1
page) identifying the 3–5 highest-leverage opportunities for that specific course. This memo is
the seed for the 20%-customized layer of the calendar and automations.

---

## Week 2 — Audience Growth Engine

**Goal:** Every visitor to the course's website and every golfer on property has a low-friction
way to join the database.

### Website lead capture
- Install a popup/embedded signup form (exit-intent + timed fallback) capturing: first name,
  email, mobile number (where SMS is enabled), ZIP/postal code (used for local-vs-visitor
  segmentation).
- Standard offer copy focuses on benefit, not on "join our newsletter":
  - "Get twilight rates, weather alerts, and tee-time openings before anyone else."
  - "Be the first to know about [Course Name] events, leagues, and member specials."
- Placement: homepage, tee-times page, events page. One template, restyled to course brand — this
  is the 80% standardized / 20% brand-matched pattern used throughout.

### On-property and offline list growth (menu — pick 3–5 highest-fit per course in Week 1 memo)
- QR codes: clubhouse entry, pro shop counter, scorecards, restaurant tables, driving range bays,
  cart signage
- Tournament/outing registration forms (always capture email/mobile, always opt in to ongoing
  marketing with clear disclosure)
- Wi-Fi splash page signup (if the course's router supports it)
- Giveaways / prize drawings (quarterly, low-cost — e.g., free round, sleeve of balls)
- Social media bio links and post CTAs driving to the signup landing page
- POS receipt footer with a QR code and one-line offer
- Membership inquiry forms (always captured even for non-converting leads)
- Event registration forms (leagues, clinics, junior camps)

**Output of Week 2:** live popup, at least 3 on-property capture points active, one dedicated
signup landing page for QR/offline traffic to land on.

---

## Week 3 — Database Organization & Segmentation

**Goal:** One clean, deduplicated list, segmented into the subset of groups that actually change
what we send — not segmentation for its own sake.

Process:
1. Import/merge all existing sources (POS export, booking system export, old ESP list, new signups)
   into the working platform.
2. Deduplicate and standardize fields (name, email, phone, ZIP, last visit date, total visits,
   total spend if available, membership status).
3. Suppress/flag invalid emails and hard bounces before first send (protects sender reputation).
4. Apply the standard segmentation framework (full detail in `04-automations-and-segmentation.md`)
   — built to avoid over-segmentation. Only segments that change messaging or offer make the cut:
   Members/Passholders, VIP/High-Value, Frequent, Occasional, First-Time, Lapsed 60/90/180/365,
   League Players, Tournament Players, Lesson Customers, Local vs. Visitor, Gift-Card Purchasers.

**Output of Week 3:** one clean master list inside the chosen platform, tagged/segmented, with
a documented segment definition sheet specific to that course (thresholds like "frequent" scaled
to that course's typical visit frequency).

---

## Week 4 — Automated Revenue Journeys

**Goal:** The 12 standardized automations (full spec in `04-automations-and-segmentation.md`) are
built, connected to real triggers, and QA'd before going live.

Standard build order (highest revenue-per-hour-of-setup first):
1. New subscriber welcome series
2. First-time golfer / post-round series
3. Review request
4. 60/90-day golfer reactivation
5. Second-round conversion
6. Membership/pass inquiry nurture
7. Tournament/outing inquiry nurture
8. Gift-card buyer follow-up
9. New member onboarding
10. Birthday flow
11. League registration reminders
12. Major seasonal reactivation campaign (built as a template, scheduled per the annual calendar)

Each flow is QA'd on a test profile before activation (see QA checklist in
`06-operations-and-sops.md`).

**Output of Week 4:** all 12 flows live (or explicitly deferred with a reason — e.g., no lesson
program exists yet — logged in the account file, not silently skipped).

---

## Week 5 — Annual Revenue Calendar

**Goal:** A 12-month campaign calendar, adapted from the standardized PNW template
(`03-marketing-calendar.md`) to this course's specific events, offers, and Week 1 priorities.

Process:
- Start from the standardized month-by-month theme list.
- Layer in the course's actual dates: member-guest, city tournament, league start/end dates,
  known corporate outings, aerification schedule if known.
- Confirm which of the four pillars (Grow / Get Back / Increase Value / Fill Inventory) each
  month leans on based on the Week 1 findings memo.
- Get written GM/owner sign-off on the calendar before Week 6 launch — this is the approval
  gate that prevents mid-month scope disputes later.

**Output of Week 5:** a signed-off 12-month calendar specific to the course, stored in the
client's folder (structure defined in `06-operations-and-sops.md`).

---

## Week 6 — Launch & Tracking

**Goal:** Everything above goes live simultaneously, with tracking in place to prove the
guarantee and populate month 1 reporting.

Launch checklist:
- [ ] Popup/signup form live and tested on desktop + mobile
- [ ] Lists cleaned, deduplicated, bounces suppressed
- [ ] Segments created and verified against sample profiles
- [ ] All 12 automations live (or deferred items logged)
- [ ] Email authentication configured (SPF, DKIM, DMARC) and sender reputation checked
- [ ] SMS compliance checked (opt-in language, opt-out handling, carrier registration/10DLC where
      required)
- [ ] Analytics established (GA4 installed and verified, goals/events configured)
- [ ] Tracking links established (UTM convention applied to every campaign link — see naming
      conventions in `06-operations-and-sops.md`)
- [ ] Revenue attribution established where technically possible (promo codes, dedicated booking
      links, or platform-native revenue tracking — see attribution limits in
      `07-capacity-hiring-tech-stack.md`)
- [ ] Monthly calendar approved (from Week 5)
- [ ] First month's campaigns scheduled
- [ ] Reporting dashboard created and shared with GM/owner (format in
      `02-monthly-service-and-reporting.md`)

**Output of Week 6:** account transitions from buildout to standard monthly management cadence.
The 90-day guarantee measurement window starts on the Week 6 launch date, not the contract
signing date — the course only gets billed the ongoing fee once the engine is actually live.
