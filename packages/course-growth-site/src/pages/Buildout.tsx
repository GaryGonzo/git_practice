import { CTAButton, Section, SectionHeading, WeekCard } from "../components/ui";

export function Buildout() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="The 6-Week Course Revenue Buildout"
          title="Six weeks. One system. Nothing left to guess."
          subtitle="Every new course goes through the same standardized buildout — so nothing gets missed, and so we can show you exactly what's live by the time we start running it every month."
        />
      </Section>

      <Section className="pt-0">
        <div>
          <WeekCard week="Week 1" title="Revenue Audit">
            We document your website, tee-time system, POS and customer database, email/SMS
            capability, membership and league programs, tournaments, lessons, range, F&amp;B,
            merchandise, gift cards, current promotions, and traffic — then hand you a short
            findings memo identifying the highest-leverage opportunities for your course
            specifically.
          </WeekCard>
          <WeekCard week="Week 2" title="Audience Growth Engine">
            We install a website signup popup built around real benefits — special rates, events,
            tee-time alerts, local golf news — and stand up on-property list growth through QR
            codes at the clubhouse, pro shop, scorecards, driving range, and tournament
            registrations.
          </WeekCard>
          <WeekCard week="Week 3" title="Database Organization & Segmentation">
            We clean, merge, and deduplicate every list you have, then apply a segmentation
            framework built to actually change what we send — members, VIPs, frequent and
            occasional golfers, lapsed 60/90/180/365-day segments, league and tournament players,
            and more, sized to what's genuinely useful for your course.
          </WeekCard>
          <WeekCard week="Week 4" title="Automated Revenue Journeys">
            We build and QA 12 standardized automations — welcome series, first-time golfer
            follow-up, review requests, reactivation flows, membership and tournament inquiry
            nurture, birthday offers, gift-card follow-up, new member onboarding, league reminders,
            and seasonal reactivation campaigns.
          </WeekCard>
          <WeekCard week="Week 5" title="Annual Revenue Calendar">
            We adapt our standardized 12-month Pacific Northwest golf calendar to your course's
            actual events, leagues, and tournament dates, then get your sign-off before anything
            launches.
          </WeekCard>
          <WeekCard week="Week 6" title="Launch & Tracking">
            Popup live, lists clean, segments built, automations running, email and SMS compliance
            checked, analytics and revenue tracking in place, calendar approved, first campaigns
            scheduled, and your reporting dashboard live. This is also when your 90-day guarantee
            window starts.
          </WeekCard>
        </div>
      </Section>

      <Section dark>
        <SectionHeading
          dark
          eyebrow="What it costs"
          title="A one-time buildout fee, then a flat monthly rate."
          subtitle="$1,500 for the 6-week buildout, then $2,000/month for ongoing management — no tiers, no surprise add-ons. Founding courses may qualify for a 90-day pilot with the buildout fee waived."
        />
        <div className="mt-8">
          <CTAButton to="/apply">Apply for a Call</CTAButton>
        </div>
      </Section>
    </>
  );
}
