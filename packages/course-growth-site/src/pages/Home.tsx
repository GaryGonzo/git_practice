import { CTAButton, Section, SectionHeading, PillarCard, StatTile, Card, Eyebrow } from "../components/ui";

const REVENUE_STREAMS = [
  "Tee times", "Memberships & passes", "Leagues", "Tournaments & outings",
  "Lessons", "Driving range", "Gift cards", "Merchandise",
  "Food & beverage", "Events", "Repeat visits", "Lapsed-golfer reactivation",
];

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-sand bg-fairway-dark text-cream">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Eyebrow>Oregon Golf Guide — Course Growth</Eyebrow>
            <h1 className="font-display text-4xl leading-[1.05] text-cream sm:text-5xl lg:text-6xl">
              Make $2 For Every $1 You Spend With Us — Guaranteed.<span className="text-gold">*</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
              You've already spent years earning your golfers. We build and run the done-for-you
              system that turns them — and the traffic already hitting your website — into more
              tee times, memberships, and F&B revenue.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <CTAButton to="/apply" variant="primary">Apply for a Call</CTAButton>
              <CTAButton to="/guarantee" variant="ghost" className="!border-cream/30 !text-cream hover:!border-cream hover:!bg-cream/10">
                See how the guarantee works
              </CTAButton>
            </div>
            <p className="mt-4 text-xs text-cream/50">
              *Measured on trackable, campaign-attributed revenue over a 90-day window. Eligibility
              terms apply — full details on the{" "}
              <a href="/guarantee" className="underline underline-offset-2">Guarantee page</a>.
            </p>
          </div>

          <Card className="border-gold/30 bg-fairway/40 text-cream backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-gold-light">
              What this replaces
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/80">
              Not a social media package. Not a website redesign. Not "digital transformation."
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/90">
              A revenue system for your tee sheet, your database, and your member/pass renewals —
              built in 6 weeks, run every month.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label="Setup" value="6 wks" />
              <StatTile label="Monthly" value="$2,000" />
              <StatTile label="Guarantee" value="2:1" />
            </div>
          </Card>
        </div>
      </section>

      {/* Positioning */}
      <Section>
        <SectionHeading
          eyebrow="The problem"
          title="Your golfers are already there. Most courses just aren't earning enough from them."
          subtitle="A course with a healthy tee sheet and a loyal following is still leaving revenue on the table every month — an email list that never gets emailed, twilight tee times that go empty, membership inquiries that never get followed up, golfers who played once and never came back."
        />
        <div className="mt-10 flex flex-wrap gap-2">
          {REVENUE_STREAMS.map((s) => (
            <span
              key={s}
              className="rounded-full border border-sand bg-white px-4 py-1.5 text-sm text-ink/70"
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      {/* Four pillars */}
      <Section className="bg-cream-dark">
        <SectionHeading
          eyebrow="How we help"
          title="Four pillars. Every dollar we generate ties back to one of them."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PillarCard number="01" title="Grow The Audience" description="Turn website visitors and on-property golfers into a real owned email and SMS database." />
          <PillarCard number="02" title="Get Golfers Back" description="Bring back golfers who played once, or haven't played in 60, 90, 180, or 365 days." />
          <PillarCard number="03" title="Increase Customer Value" description="Move golfers toward memberships, passes, leagues, tournaments, lessons, and gift cards." />
          <PillarCard number="04" title="Fill Perishable Inventory" description="Sell the tee times that would otherwise expire unused — slow weekdays, twilight, last-minute." />
        </div>
      </Section>

      {/* Process teaser */}
      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="A 6-week buildout. Then we run it every month."
          subtitle="Audit, audience growth, segmentation, automated revenue journeys, a 12-month calendar, and a live reporting dashboard — built once, then managed month to month."
        />
        <div className="mt-8">
          <CTAButton to="/buildout" variant="secondary">See the 6-Week Buildout</CTAButton>
        </div>
      </Section>

      {/* Guarantee callout */}
      <Section dark>
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <SectionHeading
            dark
            eyebrow="The guarantee"
            title="If we don't generate at least $2 for every $1 you pay us in 90 days, you don't pay again until we do."
            subtitle="This isn't a slogan — it's how the engagement is structured. Full eligibility terms are written in plain English, no fine-print surprises."
          />
          <CTAButton to="/guarantee" variant="primary">Read the full guarantee</CTAButton>
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="rounded-md border border-sand bg-white px-8 py-14 text-center">
          <h2 className="font-display text-3xl text-fairway-dark sm:text-4xl">
            More Rounds. More Members. More Revenue.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink/70">
            We're currently working with a limited number of Oregon courses. Apply for a 15-minute
            call to see if it's a fit.
          </p>
          <div className="mt-8">
            <CTAButton to="/apply">Apply for a Call</CTAButton>
          </div>
        </div>
      </Section>
    </>
  );
}
