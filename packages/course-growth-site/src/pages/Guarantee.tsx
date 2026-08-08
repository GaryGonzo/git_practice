import { CTAButton, Section, SectionHeading, Card } from "../components/ui";

export function Guarantee() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="The guarantee"
          title="Make $2 for every $1 you spend with us — guaranteed."
          subtitle="This page is the plain-English version of how it actually works — not a slogan. Final terms live in your service agreement, reviewed by an attorney before you sign."
        />
      </Section>

      <Section className="pt-0">
        <Card className="bg-white p-8">
          <h3 className="font-display text-2xl text-fairway-dark">How it works</h3>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            Starting the day your system launches (the end of your 6-week buildout), we track
            every dollar of revenue we can directly tie to a campaign we ran — using unique promo
            codes, dedicated tracking links, or your booking system's own attribution, wherever
            that's technically available. At the 90-day mark, we add it up.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            If that trackable revenue is at least <strong>double</strong> what you've paid us in
            management fees over that period, the guarantee is met. If it's short, your management
            fee is waived — you don't pay again — until the cumulative number clears the 2:1 bar,
            up to a maximum waiver period of three additional months.
          </p>
        </Card>
      </Section>

      <Section className="bg-cream-dark pt-0">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-xl text-fairway-dark">What counts toward the guarantee</h3>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/70">
              <li>• Revenue tied to a unique promo or booking code from a specific campaign</li>
              <li>• Revenue from a dedicated tracking link with booking or analytics confirmation</li>
              <li>• Revenue attributed natively inside your email/SMS platform</li>
            </ul>
            <p className="mt-4 text-sm text-ink/50">
              Directional or estimated revenue (before/after comparisons where no direct tracking
              exists) is reported separately and doesn't count toward the guarantee unless we
              agree in writing to include a specific instance.
            </p>
          </div>

          <div>
            <h3 className="font-display text-xl text-fairway-dark">Eligibility — what we need from you</h3>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/70">
              <li>• Access to your website, booking/POS, and email/SMS systems</li>
              <li>• Reasonably available tee-time inventory for the campaigns we run</li>
              <li>• Approval turnaround within 2 business days</li>
              <li>• Advertised offers and promo codes honored as run</li>
              <li>• Advance notice of major pricing or offer changes</li>
              <li>• Following the agreed calendar and strategy in good faith</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <Card className="bg-white p-8">
          <h3 className="font-display text-xl text-fairway-dark">What's excluded</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
            Course closures from weather, fire, or natural disaster; extended renovation or
            ownership changes not caused by us; and outages or acts outside anyone's reasonable
            control. If a covered event closes the course for more than 5 consecutive days during
            the measurement window, the window pauses and resumes when you reopen.
          </p>
        </Card>
      </Section>

      <Section dark>
        <SectionHeading
          dark
          eyebrow="Fine print, in plain sight"
          title="This page is marketing language, written to be read and understood."
          subtitle="It is not the contract. Before you sign anything, we put the full terms in a written service agreement, and we strongly recommend — and structure our own agreements to have gone through — attorney review of the guarantee language, the definition of trackable revenue, and the remedy terms. Ask us for the full written terms any time."
        />
        <div className="mt-8">
          <CTAButton to="/apply">Ask us about the guarantee</CTAButton>
        </div>
      </Section>
    </>
  );
}
