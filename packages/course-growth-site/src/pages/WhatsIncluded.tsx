import { CTAButton, Section, SectionHeading, Card } from "../components/ui";

const INCLUDED = [
  "4–6 email campaigns every month",
  "2–4 SMS campaigns every month, where SMS is enabled and appropriate",
  "A monthly promotional calendar, delivered before the month starts",
  "Management of all 12 automated revenue journeys",
  "Ongoing database growth (popup performance, QR capture points, list hygiene)",
  "Segmentation upkeep",
  "Reactivation campaigns for lapsed golfers",
  "Tee-time inventory campaigns for slow weekdays, twilight, and last-minute openings",
  "Membership and pass marketing",
  "Tournament, outing, and league marketing support",
  "Monthly revenue attribution and reporting",
  "A quarterly strategy review call",
];

const EXCLUDED = [
  ["Daily social media management", "We may hand you 2–4 ready-to-post assets a month, but we don't run your accounts or reply to comments."],
  ["Photography or video production", "We refer a local partner. We don't resell or manage this work."],
  ["Full website redesign", "We install and optimize lead capture. A full rebuild is a separate, scoped project."],
  ["Customer support", "Booking issues, refunds, and complaints stay with your team."],
  ["From-scratch design on every campaign", "We work from a reusable content library and customize it to your brand — not a bespoke build every time."],
  ["Unlimited revisions", "Two rounds of revision per asset are included."],
  ["Constant meetings", "One monthly touchpoint plus a quarterly review — not on-demand calls."],
  ["Paid media management", "Available as an add-on starting month 3, once your owned channels are proven."],
];

export function WhatsIncluded() {
  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="What's included"
          title="A clear scope. No surprises either direction."
          subtitle="Everything below runs every month for $2,000, flat. We're also upfront about what's not included — so the relationship stays sustainable at the price we charge."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-xl text-fairway-dark">Included every month</h3>
            <ul className="mt-4 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink/80">
                  <span className="mt-1 text-gold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xl text-fairway-dark">Not included (and why)</h3>
            <ul className="mt-4 space-y-4">
              {EXCLUDED.map(([title, note]) => (
                <li key={title} className="text-[15px] leading-relaxed">
                  <span className="font-semibold text-ink/80">{title}</span>
                  <span className="text-ink/60"> — {note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-cream-dark">
        <SectionHeading
          eyebrow="Reporting"
          title="A one-page report you can read in under two minutes."
          subtitle="No vanity metrics leading the page. Revenue and return, first."
        />
        <Card className="mt-8 max-w-xl bg-white p-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Example month</div>
          <div className="mt-4 space-y-2 text-lg">
            <div className="flex justify-between"><span className="text-ink/70">Monthly attributable revenue</span><span className="font-semibold text-fairway-dark">$12,400</span></div>
            <div className="flex justify-between"><span className="text-ink/70">Management fee</span><span className="font-semibold text-fairway-dark">$2,000</span></div>
            <div className="flex justify-between border-t border-sand pt-2"><span className="text-ink/70">Return</span><span className="font-display text-2xl text-gold">6.2X</span></div>
          </div>
          <p className="mt-4 text-xs text-ink/50">
            Illustrative example. Actual results vary by course — see the Guarantee page for how
            we track and report real numbers.
          </p>
        </Card>
        <div className="mt-8">
          <CTAButton to="/apply">Apply for a Call</CTAButton>
        </div>
      </Section>
    </>
  );
}
