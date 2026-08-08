import { CTAButton, Section, SectionHeading, Card } from "../components/ui";

export function About() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="About"
          title="Oregon Golf Guide, on the business side."
          subtitle="Oregon Golf Guide started on the golfer side — course discovery, guides, and rankings for people playing golf around Oregon. Course Growth is the natural next step: taking what we understand about how Oregon golfers actually behave and turning it into a revenue system for the courses themselves."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-white p-8">
            <h3 className="font-display text-xl text-fairway-dark">Discover Oregon Golf</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              The consumer side of Oregon Golf Guide — course discovery, guides, rankings, and
              content for golfers across the state. Over time, this audience becomes an additional
              channel for the courses we work with on the business side.
            </p>
          </Card>
          <Card className="bg-white p-8">
            <h3 className="font-display text-xl text-fairway-dark">OGG Course Growth</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              The business side — a done-for-you revenue system for local and regional golf
              courses, starting in Oregon and expanding across the Pacific Northwest.
            </p>
          </Card>
        </div>
      </Section>

      <Section className="bg-cream-dark">
        <SectionHeading
          eyebrow="Why this exists"
          title="We think a course's marketing should sound like golf, not like an agency."
          subtitle="Most golf courses don't need a marketing department — they need someone who understands a tee sheet, a shoulder season, and an aerification schedule, and who's willing to be measured on revenue instead of impressions. That's what we built."
        />
      </Section>

      <Section>
        <div className="rounded-md border border-sand bg-white px-8 py-12 text-center">
          <h2 className="font-display text-2xl text-fairway-dark sm:text-3xl">
            Helping Oregon's golf courses grow.
          </h2>
          <div className="mt-8">
            <CTAButton to="/apply">Apply for a Call</CTAButton>
          </div>
        </div>
      </Section>
    </>
  );
}
