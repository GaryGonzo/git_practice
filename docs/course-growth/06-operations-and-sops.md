# Internal Operating System & SOPs

Goal: one skilled operator can run ~10 courses concurrently because 80% of the work is templated.
This document is the system that makes that true. Everything here is written to be handed to a
first hire (see `07-capacity-hiring-tech-stack.md`) with minimal additional explanation.

## 1. Client onboarding checklist

- [ ] Signed service agreement received
- [ ] Setup fee invoiced/collected (or pilot terms confirmed)
- [ ] Client folder created (structure below)
- [ ] Kickoff email sent with access request checklist
- [ ] Week 1 audit call scheduled
- [ ] Client added to task management system (project created from the standard buildout
      template — see Task Management Structure below)
- [ ] Client added to monthly reporting calendar

## 2. Access request checklist (sent at kickoff)

- [ ] Website admin/editor access (or a technical contact who can install a popup snippet)
- [ ] Tee-time/booking system login or API credentials
- [ ] POS/customer database export or read access
- [ ] Current email platform login (if one exists) or confirmation to start fresh
- [ ] SMS platform login (if one exists)
- [ ] Google Analytics / Search Console access (or agreement to install GA4)
- [ ] Google Business Profile access (for review-request flow linking)
- [ ] Logo files, brand colors/fonts if any exist, photo library access

## 3. Monthly client information request (standing, sent by the 20th of each month)

- [ ] Any new offers, price changes, or promotions planned for next month
- [ ] Upcoming events/tournaments/leagues to feature
- [ ] Course conditions notes (aerification, closures, renovations)
- [ ] Any staffing/contact changes
- [ ] Flag anything that changed in their booking/POS system

## 4. Standard campaign briefing template

Used internally before building any one-off campaign (not needed for standard calendar/automation
items, which follow the library directly):

```
Campaign: [name]
Pillar: [Grow / Get Back / Increase Value / Fill Inventory]
Audience/segment: 
Goal + target metric: 
Offer: 
Send date(s): 
Email / SMS / both: 
Source template from content library: 
Course-specific customization needed: 
Approval deadline: 
```

## 5. Campaign creation workflow (standard, per campaign)

1. Pull the relevant template from the reusable content library.
2. Swap in course branding (logo, colors, photos) — template variables, not rebuilt from scratch.
3. Write course-specific offer/copy variables (the 20%).
4. Apply standard UTM tagging (naming convention below).
5. Internal QA pass (checklist below).
6. Send for client approval (approval process below).
7. Schedule send.
8. Log in the client's campaign tracker for that month's report.

## 6. QA checklist (every campaign, before approval)

- [ ] Links work and are UTM-tagged correctly
- [ ] Promo code (if used) is live and tested in the booking/POS system
- [ ] Mobile rendering checked (email and SMS)
- [ ] Correct segment selected — recipient count sanity-checked against expected list size
- [ ] Unsubscribe/opt-out link present and functional
- [ ] Course name, dates, and offer details are accurate (no leftover template placeholder text)
- [ ] Send time matches the approved calendar

## 7. Email approval process

- Draft delivered via the client's preferred lightweight channel (email or shared doc — no new
  tool for the client to learn).
- Standard SLA: client has 2 business days to approve or request changes; no response = approved
  (stated in the SOW and re-stated in the monthly info request).
- Up to 2 rounds of revision included per campaign (see SOW exclusions).

## 8. SMS approval process

- Same draft/approval flow as email, with an explicit compliance check before every send:
  opt-in basis confirmed, opt-out instructions included, message frequency reasonable
  (SMS-specific — never bundled silently into the email approval).
- SMS only activated for a client once 10DLC/carrier registration and documented opt-in are
  confirmed (Week 6 launch gate).

## 9. Monthly reporting process

1. Pull data from ESP/CRM, booking system, and POS (per the attribution method available for that
   client) by the 3rd business day of the month.
2. Populate `templates/monthly-report-template.md` for that client.
3. Internal review pass (numbers sanity-checked against last month, no unexplained swings without
   a note).
4. Deliver by the 5th business day.
5. Log cumulative 90-day guarantee tracking figure (running total, not just the month).

## 10. Quarterly strategy review process

- 30-minute call, scheduled at the start of the quarter.
- Agenda (standard, reused every quarter): trailing-90-day results recap → what's working → what's
  changing next quarter on the calendar → any scope/add-on conversation (paid media, website
  add-on) → renewal/contract check-in if relevant.

## 11. Client folder structure (standardized, identical shape for every client)

```
/clients/[course-name]/
  /01-onboarding/         (audit doc, access checklist, signed agreement)
  /02-brand/              (logo, colors, fonts, photo library)
  /03-calendar/            (that client's approved 12-month calendar)
  /04-automations/        (flow copy/config specific to this client)
  /05-campaigns/
    /[year]-[month]/      (one folder per send month)
  /06-reports/
    /[year]-[month]-report.pdf
  /07-notes/              (running account notes, quarterly review notes)
```

## 12. Naming conventions

- **Client folder/project name:** `[course-short-name]` (lowercase, hyphenated) e.g. `pine-ridge-gc`
- **Campaign files:** `[YYYY-MM-DD]_[course-short-name]_[campaign-slug]_[email|sms]`
  e.g. `2026-05-08_pine-ridge-gc_mothers-day-brunch_email`
- **UTM convention:** `utm_source=ogg`, `utm_medium=email|sms`, `utm_campaign=[campaign-slug]`,
  `utm_content=[course-short-name]`
- **Promo codes:** `[COURSECODE][CAMPAIGNSHORT]` e.g. `PRGCTWILIGHT` — always unique per campaign
  per client, never reused, so redemptions map to a single send.

## 13. Reusable content library structure

```
/library/
  /automations/         (the 12 standard flows, as editable master templates)
  /calendar/             (the 12-month standardized calendar skeleton)
  /email-templates/      (base layouts: welcome, offer, newsletter-style update, event promo)
  /sms-templates/        (base copy blocks by use case: reactivation, last-minute inventory,
                           event reminder, birthday)
  /popup-templates/      (signup form variants: general, event-specific, gift-card)
  /graphics/             (base design templates in editable format — swap logo/colors/photos)
  /audit-and-onboarding/ (revenue audit template, access checklist, proposal template)
  /reporting/            (monthly report template, dashboard build spec)
```

## 14. Reusable automation library

Master copies of all 12 flows (`04-automations-and-segmentation.md`), built once per ESP platform
in use (see tech stack doc) as clone-able templates with variables for course name, segment names,
and offer text — never rebuilt from a blank canvas per client.

## 15. Reusable campaign library

A running archive of every campaign built for any client, tagged by pillar and by seasonal moment
(e.g., "Mother's Day / Increase Value"), so a new client's calendar can be populated largely by
selecting and re-skinning proven campaigns rather than writing new ones from scratch.

## 16. Annual marketing calendar

Master copy lives at `03-marketing-calendar.md`; each client gets a cloned, customized version
stored in their `03-calendar/` folder per the folder structure above.

## 17. Task management structure

- One task management tool (see tech stack doc) with:
  - A **Buildout** project template (the 6-week checklist, cloned per new client)
  - A **Monthly Ops** board with one recurring card per client per month (campaign build →
    QA → approval → scheduled → sent → reported)
  - A **Content Library** space (not client-specific) for maintaining master templates
- Every recurring monthly task is templated so a new month is a clone-and-fill exercise, not a
  from-scratch planning session.

## 18. What's 100% standardized vs. customized per course

| Standardized (~80%) | Customized (~20%) |
|---|---|
| 6-week buildout process and checklist | Course-specific events, dates, offers |
| The 12 automation flows (logic, timing, structure) | Copy, visuals, brand voice |
| The 12-month calendar skeleton | Local seasonality quirks, course-specific promotions |
| Segmentation framework | Which segments are "minimum viable" for that course's data |
| Reporting dashboard format | The actual numbers, obviously |
| QA/approval process | POS/ESP-specific integration details |
| Contract and guarantee terms | Segment thresholds (e.g., what counts as "frequent") |
| Content library base templates | Final creative execution per send |
