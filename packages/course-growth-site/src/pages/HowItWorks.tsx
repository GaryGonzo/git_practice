import { CTAButton, Section, SectionHeading, Card } from "../components/ui";

export function HowItWorks() {
  return (
    <>
      <Section className="pb-10">
        <SectionHeading
          eyebrow="How it works"
          title="One system. Two phases. No guesswork."
          subtitle="We start by building the revenue infrastructure your course doesn't have time to build itself. Then we run it, every month, and show you exactly what it produced."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-white p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-gold">Phase 1 — Weeks 1–6</div>
            <h3 className="mt-2 font-display text-2xl text-fairway-dark">The Course Revenue Buildout</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              We audit your course, build your list-growth engine, organize and segment your
              database, build 12 automated revenue journeys, put together a 12-month campaign
              calendar tailored to your course, and stand up a reporting dashboard — all before
              you pay a single month of ongoing fees.
            </p>
            <div className="mt-5">
              <CTAButton to="/buildout" variant="ghost">See the week-by-week plan</CTAButton>
            </div>
          </Card>

          <Card className="bg-white p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-gold">Phase 2 — Ongoing</div>
            <h3 className="mt-2 font-display text-2xl text-fairway-dark">Monthly Management</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              We run the calendar we built together — 4 to 6 email campaigns, SMS where it makes
              sense, automated flows kept fresh, reactivation pushes, tee-time inventory
              campaigns, and a one-page report every month that shows exactly what it generated.
            </p>
            <div className="mt-5">
              <CTAButton to="/whats-included" variant="ghost">See what's included</CTAButton>
            </div>
          </Card>
        </div>
      </Section>

      <Section className="bg-cream-dark">
        <SectionHeading eyebrow="Getting started" title="From first call to launch" />
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", title: "Apply", copy: "Tell us about your course. We'll confirm it's a fit before anything else happens." },
            { step: "2", title: "Discovery call", copy: "15 minutes on your current tee sheet, database, and biggest revenue leaks." },
            { step: "3", title: "Sign & kick off", copy: "Agreement signed, access granted, week 1 audit call scheduled." },
            { step: "4", title: "6-week buildout", copy: "We build the full system. You approve the calendar. We launch and start tracking." },
          ].map((s) => (
            <li key={s.step} className="border border-sand bg-white p-6">
              <div className="font-display text-3xl text-gold">{s.step}</div>
              <div className="mt-2 font-semibold text-fairway-dark">{s.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.copy}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <CTAButton to="/apply">Apply for a Call</CTAButton>
        </div>
      </Section>
    </>
  );
}
