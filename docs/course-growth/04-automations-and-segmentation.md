# Automated Revenue Journeys & Segmentation Framework

## Part 1 — Segmentation framework

Principle: **a segment only exists if it changes what we send or what offer we make.** No
segment-for-segmentation's-sake. This list is the standardized default; a course's Week 3 build
uses whichever subset is genuinely useful for that course's size and data (a 9-hole muni with
1,200 emails doesn't need all 17 — see "minimum viable" note at the end).

| Segment | Definition | Why it's useful |
|---|---|---|
| Members / Passholders | Active membership or annual pass on file | Different message (perks, events) than public-play offers; never sent public green-fee discounts |
| VIP / High-value golfers | Top ~10% by visits or spend (course-specific threshold) | Priority access, personal touches, protects from over-discounting |
| Frequent golfers | Regular play, below VIP threshold | Core repeat-business audience — most inventory-fill and event campaigns |
| Occasional golfers | Play a few times/year | Nudge toward frequency (punch cards, bundle offers) |
| One-time / first-time golfers | Exactly one recorded visit | Feeds the post-round and second-round-conversion flows |
| Lapsed 60-day | Played, nothing recorded in 60 days | Light-touch reactivation |
| Lapsed 90-day | Nothing in 90 days | Stronger reactivation offer |
| Lapsed 180-day | Nothing in 180 days | "We miss you" + meaningful incentive |
| Lapsed 365-day | Nothing in a year | Win-back campaign, different tone (re-introduction, not a nudge) |
| League players | Registered in any league, current or past | League renewal, league-specific event promotion |
| Tournament players | Registered for a tournament/outing | Outing upsell (next tournament, group bookings) |
| Lesson customers | Booked a lesson | Range/practice upsell, progression offers |
| Local residents | ZIP within defined local radius | Frequency/loyalty offers, twilight/weekday fill |
| Visitors / tourists | ZIP outside local radius (resort/destination courses) | Value/experience messaging, less discount-driven |
| Gift-card purchasers | Bought a gift card | Follow-up to convert the *recipient*, not just track the buyer |

**Deliberately excluded from standard practice:** micro-segments by exact handicap, by exact
number of rounds, by single-campaign engagement score, or anything that would require manual
upkeep beyond what the ESP can automate. If a segment can't be kept current automatically from
POS/booking/ESP data, it doesn't survive Week 3.

**Minimum viable segmentation** for a smaller course or thin dataset: Members/Passholders,
Lapsed-90, Lapsed-365, First-Time, Local vs. Visitor. Everything else layers in as data quality
improves.

---

## Part 2 — The 12 standardized automated flows

Each flow below is a template: logic, timing, and structure are ~80% standardized; subject lines,
offers, and visuals are the ~20% customized per course. All flows use an email/SMS mix, with SMS
reserved for genuinely time-sensitive or high-intent moments (never SMS for a generic nurture).

### 1. New Subscriber Welcome Series
- **Trigger:** New signup (popup, QR, event registration opt-in)
- **Audience:** All new subscribers
- **Goal:** First booking or first on-property visit
- **Messages:** 3 emails
- **Timing:** Immediate, +2 days, +5 days
- **Mix:** Email only
- **Primary CTA:** Book a tee time / view rates
- **Revenue metric:** First-booking conversion rate from welcome series

### 2. First-Time Golfer / Post-Round Series
- **Trigger:** First recorded visit (POS/booking data)
- **Audience:** First-time golfers
- **Goal:** Convert to a second visit
- **Messages:** 2 emails + 1 SMS
- **Timing:** +1 day (thank you/SMS), +4 days (email — what to know/come back tip), +10 days
  (email — offer to return)
- **Mix:** Email + SMS
- **Primary CTA:** Book your next round
- **Revenue metric:** First-to-second-visit conversion rate

### 3. Review Request
- **Trigger:** +3 days after a recorded round
- **Audience:** All golfers with a completed round, excluding very recent review-requesters
- **Goal:** Google/Facebook reviews (supports organic acquisition, not itself revenue-attributed)
- **Messages:** 1 email, 1 SMS follow-up if no click after 3 days
- **Timing:** +3 days, +6 days
- **Mix:** Email + SMS
- **Primary CTA:** Leave a review
- **Revenue metric:** N/A directly — tracked as a supporting metric (review count/rating trend),
  not counted toward the $2:$1 guarantee

### 4. Second-Round Conversion
- **Trigger:** One recorded visit, no second visit within 21 days
- **Audience:** One-time golfers past the post-round series window
- **Goal:** Second booking
- **Messages:** 2 emails
- **Timing:** Day 21, Day 35
- **Mix:** Email
- **Primary CTA:** Book with a small incentive (e.g., cart upgrade, range balls included)
- **Revenue metric:** Conversion rate, incremental bookings

### 5. 60/90-Day Golfer Reactivation
- **Trigger:** No visit in 60 days → light touch; no visit in 90 days → stronger offer
- **Audience:** Lapsed-60 and Lapsed-90 segments
- **Goal:** Rebook
- **Messages:** 2 emails + 1 SMS per stage
- **Timing:** Day 60 (email), Day 66 (SMS if no open), Day 90 (email, stronger offer), Day 95 (SMS)
- **Mix:** Email + SMS
- **Primary CTA:** Book now / claim offer
- **Revenue metric:** Reactivated-golfer count and revenue (core guarantee-eligible metric)

### 6. Membership / Pass Inquiry Nurture
- **Trigger:** Membership inquiry form submitted, no purchase within 3 days
- **Audience:** Membership/pass inquiries
- **Goal:** Convert to purchase
- **Messages:** 3 emails
- **Timing:** +1 day, +4 days, +10 days (final-call/urgency)
- **Mix:** Email, phone-call task created for GM/pro shop on high-intent inquiries
- **Primary CTA:** Complete membership purchase
- **Revenue metric:** Inquiry-to-purchase conversion rate, membership revenue

### 7. Tournament / Outing Inquiry Nurture
- **Trigger:** Outing/tournament inquiry form submitted
- **Audience:** Tournament/outing leads
- **Goal:** Booked event
- **Messages:** 2 emails + task for direct follow-up call (outings close on relationship, not
  just email)
- **Timing:** +1 day, +5 days
- **Mix:** Email + internal task
- **Primary CTA:** Schedule a call / reserve your date
- **Revenue metric:** Booked-outing revenue

### 8. Birthday Flow
- **Trigger:** Birthday on file, 7 days prior
- **Audience:** All subscribers with birthdate captured
- **Goal:** On-property visit near birthday
- **Messages:** 1 email
- **Timing:** 7 days before birthday
- **Mix:** Email
- **Primary CTA:** Book a birthday round (small perk — free range bucket, cart upgrade)
- **Revenue metric:** Bookings attributed to birthday offer

### 9. Gift-Card Buyer Follow-Up
- **Trigger:** Gift card purchase
- **Audience:** Gift-card purchasers
- **Goal:** Convert the *recipient*, and prompt repeat gift-card purchases
- **Messages:** 2 emails (1 to purchaser confirming + tips, 1 timed reminder if unredeemed after
  30 days)
- **Timing:** Immediate, +30 days if unredeemed
- **Mix:** Email
- **Primary CTA:** Redeem your gift card / buy another
- **Revenue metric:** Redemption rate, follow-on gift card sales

### 10. New Member Onboarding
- **Trigger:** New membership/pass purchase
- **Audience:** New members
- **Goal:** Engagement and retention from day one (reduces churn at renewal)
- **Messages:** 3 emails
- **Timing:** Immediate (welcome + perks explainer), +7 days (events/leagues to join), +30 days
  (check-in / feedback)
- **Mix:** Email
- **Primary CTA:** Book, join a league, attend an event
- **Revenue metric:** Engagement rate as a leading indicator of renewal (renewal itself tracked
  separately, longer horizon)

### 11. League Registration Reminders
- **Trigger:** League registration window opens (per calendar)
- **Audience:** League Players segment + Frequent golfers not yet in a league
- **Goal:** Registrations before deadline
- **Messages:** 3 emails + 1 SMS near deadline
- **Timing:** Window open, mid-window, 3 days before deadline (email), 1 day before (SMS)
- **Mix:** Email + SMS
- **Primary CTA:** Register now
- **Revenue metric:** League registration revenue

### 12. Major Seasonal Reactivation Campaigns
- **Trigger:** Scheduled per the 12-month calendar (e.g., spring season-opening, fall "best
  conditions" push, November reactivation before winter lull)
- **Audience:** Lapsed-180/365 + Occasional golfers
- **Goal:** Bring dormant golfers back for a seasonal moment
- **Messages:** 2–3 email + 1 SMS, built as a short campaign, not a single send
- **Timing:** Per calendar, typically a 5–7 day campaign window
- **Mix:** Email + SMS
- **Primary CTA:** Book now / claim seasonal offer
- **Revenue metric:** Reactivated-golfer count and revenue for the campaign window

---

## Build & QA notes

- All 12 flows are built from templates in the reusable automation library (structure in
  `06-operations-and-sops.md`) — logic and timing are copy-pasted and re-pointed at the new
  course's segments; only copy/offer/visuals change.
- Every flow is tested on a seeded test profile before going live (QA checklist,
  `06-operations-and-sops.md`).
- SMS is only enabled where the course has 10DLC/carrier registration in place and a compliant
  opt-in record — flows default to email-only until SMS compliance is confirmed in Week 6.
