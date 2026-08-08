import { CTAButton, Section, SectionHeading, Card } from "../components/ui";

export function Contact() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="Contact"
          title="Get in touch."
          subtitle="For course inquiries, use the application form so we can review your course details first. For everything else, reach us directly."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="bg-white p-8">
            <h3 className="font-display text-lg text-fairway-dark">Email</h3>
            <p className="mt-2 text-[15px] text-ink/70">hello@oregongolfguide.com</p>
            <h3 className="mt-6 font-display text-lg text-fairway-dark">Phone</h3>
            <p className="mt-2 text-[15px] text-ink/70">(503) 555-0142</p>
            <p className="mt-1 text-xs text-ink/40">Placeholder contact details — update before launch.</p>
          </Card>
          <Card className="bg-white p-8">
            <h3 className="font-display text-lg text-fairway-dark">Prefer to apply first?</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">
              Most courses get the fastest response through the application form — it gives us the
              context we need to make the first call worth your time.
            </p>
            <div className="mt-5">
              <CTAButton to="/apply">Apply for a Call</CTAButton>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}
