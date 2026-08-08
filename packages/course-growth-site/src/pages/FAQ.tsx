import { CTAButton, Section, SectionHeading, FAQItem } from "../components/ui";

export function FAQ() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading eyebrow="FAQ" title="Questions we hear on almost every first call." />
      </Section>

      <Section className="pt-0">
        <div className="max-w-3xl">
          <FAQItem q="Is this a marketing agency?" a="Not in the way most people mean that. We don't do brand campaigns, social media management, or ad creative for its own sake. We build and run a revenue system tied to your database, your website traffic, and your tee sheet — every deliverable maps to a specific revenue stream." />
          <FAQItem q="How does the $2-for-$1 guarantee actually work?" a="We track revenue we can directly tie to a campaign — promo codes, tracking links, or platform-native attribution — over a rolling 90-day window from launch. If that trackable revenue isn't at least double your fees paid, you stop paying the management fee until it is, up to a 3-month cap. Full plain-English terms are on the Guarantee page." />
          <FAQItem q="What do you need from us to get started?" a="Access to your website, tee-time/booking system, POS or customer database export, and your current email/SMS platform if you have one. We ask for about an hour of your time in week one for the audit call, then a few minutes a month to approve the calendar." />
          <FAQItem q="We already have someone doing our email — does that mean we don't need this?" a="Usually it means the opposite — most in-house email is a manual, occasional newsletter with no segmentation or automation behind it. We're happy to work alongside whoever handles your voice and local knowledge; we build the infrastructure underneath it." />
          <FAQItem q="Do you discount our tee times?" a="Not as a default move. The four pillars start with growing your list and bringing golfers back — discounting is a last resort, used narrowly on inventory that would otherwise sell for zero dollars, not on your best customers or your best times." />
          <FAQItem q="What platforms do you work with?" a="We work inside whatever tee-time, POS, and email/SMS system you already use — GolfNow, ForeUp, Lightspeed, Jonas, Klaviyo, Mailchimp, and others. If you don't have an email/SMS platform yet, we'll recommend one, but we never force a course to migrate off a working system." />
          <FAQItem q="How much does it cost?" a="$1,500 for the 6-week buildout, then $2,000/month for ongoing management, with a 90-day initial term. No tiers, no per-email pricing. Founding courses may qualify for a pilot with the buildout fee waived." />
          <FAQItem q="Is golf's seasonality a problem for the guarantee?" a="It's exactly why the guarantee is measured over 90 days instead of month to month — golf revenue isn't a straight line, and holding either side to a single month's number wouldn't be fair or accurate." />
          <FAQItem q="How many courses do you work with at once?" a="We intentionally cap our client count so every course gets real attention during the buildout and every month after. If we're at capacity when you apply, we'll tell you and give you a timeline." />
        </div>
      </Section>

      <Section dark>
        <SectionHeading dark eyebrow="Still have questions?" title="Ask us directly." />
        <div className="mt-8 flex flex-wrap gap-4">
          <CTAButton to="/apply">Apply for a Call</CTAButton>
          <CTAButton to="/contact" variant="ghost" className="!border-cream/30 !text-cream hover:!border-cream hover:!bg-cream/10">
            Contact Us
          </CTAButton>
        </div>
      </Section>
    </>
  );
}
