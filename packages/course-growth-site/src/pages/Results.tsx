import { CTAButton, Section, SectionHeading, Card } from "../components/ui";

export function Results() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="Results"
          title="We're onboarding our founding group of Oregon courses now."
          subtitle="This page will carry real, course-specific case studies — database growth, campaign revenue, and guarantee results — as soon as our first courses complete their 90-day measurement window. Here's exactly what will show up here."
        />
      </Section>

      <Section className="pt-0">
        <Card className="border-dashed bg-white/70 p-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-gold">Case study preview</div>
          <h3 className="mt-3 font-display text-2xl text-fairway-dark">[Course Name], [City], Oregon</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/60">
            Course type · Client since [Month Year] · 6-Week Buildout + ongoing management
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["Database growth", "Attributable revenue", "Management fee", "Return"].map((label) => (
              <div key={label} className="border border-sand bg-cream px-4 py-4 text-center">
                <div className="font-display text-2xl text-ink/30">—</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-ink/40">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section dark>
        <SectionHeading
          dark
          eyebrow="Want to be first?"
          title="Founding courses get priority pricing and a case study spot."
          subtitle="We're intentionally starting with a small group of Oregon courses so every engagement gets full attention during the buildout. Apply for a call to see if there's a founding spot open."
        />
        <div className="mt-8">
          <CTAButton to="/apply">Apply for a Call</CTAButton>
        </div>
      </Section>
    </>
  );
}
