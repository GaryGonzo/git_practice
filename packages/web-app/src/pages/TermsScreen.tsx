import { Link } from "react-router-dom";
import { GolfableMark } from "../components/GolfableMark";

const LAST_UPDATED = "August 26, 2026";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-brand text-xl tracking-wide">{title}</h2>
      <div className="font-body mt-2 space-y-3 text-sm leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

export function TermsScreen() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <GolfableMark className="h-9 w-9" />
          <span className="font-display text-brand text-3xl tracking-wide">GOLFABLE</span>
        </Link>
        <Link to="/" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
          <BackIcon className="h-4 w-4" />
          Back to Golfable
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-10 pb-24">
        <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">Golfable LLC</p>
        <h1 className="font-display mt-1 text-4xl tracking-wide">Terms of Service</h1>
        <p className="font-body mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

        <p className="font-body mt-6 text-sm leading-relaxed text-neutral-700">
          These Terms of Service ("Terms") govern your access to and use of Golfable, including our website,
          web app, and any related services (together, the "Service"), operated by Golfable LLC ("Golfable,"
          "we," "us," or "our"). By creating an account or using the Service, you agree to these Terms. If you
          don't agree, don't use the Service.
        </p>

        <Section title="1. The Service">
          <p>
            Golfable is a daily golf skill-challenge platform. Every weekday we publish a shared drill
            ("Today's Golfable") that members play and log a score for. The Service also includes: Choose Your
            Own Golfable (playing any drill in our library on your own schedule), a Library of past drills,
            leaderboards, Challenge Mode (head-to-head competitions you create with other members), Training
            Tools (in-app aids like a metronome and camera-based alignment tools), and Studio accounts (private
            leaderboards for partner businesses, described further in Section 7).
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 13 years old to create a Golfable account. If you are under 18, you may only
            use the Service with the involvement and consent of a parent or guardian. By using the Service, you
            represent that you meet these requirements.
          </p>
        </Section>

        <Section title="3. Your Account">
          <p>
            You're responsible for the accuracy of the information you provide when you sign up, and for
            keeping your login credentials secure. You're responsible for all activity that happens under your
            account. Let us know right away if you believe your account has been accessed without your
            permission.
          </p>
        </Section>

        <Section title="4. Subscriptions, Billing &amp; Cancellation">
          <p>
            Some parts of the Service are offered on a paid, recurring subscription basis. Where a subscription
            applies, you authorize us (and our payment processor) to charge your chosen payment method on a
            recurring basis — monthly, unless otherwise stated at signup — until you cancel.
          </p>
          <p>
            You can cancel your subscription at any time from your account settings. Cancellation stops future
            billing; it does not refund amounts already charged for the current billing period, and you'll keep
            access through the end of that period. We don't offer prorated refunds for partial periods except
            where required by law.
          </p>
          <p>
            We may change subscription pricing going forward. If we do, we'll give you reasonable notice before
            it applies to you, and changes never apply retroactively to a period you've already paid for.
          </p>
        </Section>

        <Section title="5. Founding Member Pricing">
          <p>
            Golfable has offered free access to a limited number of early "founding" members as part of our
            launch. If you signed up under a founding-member offer, the pricing terms of that offer (including
            "free forever," where stated) continue to apply to your account for as long as you keep it in good
            standing, even as pricing for new members changes over time.
          </p>
        </Section>

        <Section title="6. Trials, Free Tiers &amp; Price Changes">
          <p>
            Where we offer a free tier, free trial, or promotional pricing, we may modify, limit, or discontinue
            it for new signups at any time. Doing so won't change the terms already locked in for an existing
            member's account, as described in Section 5.
          </p>
        </Section>

        <Section title="7. Studio Accounts">
          <p>
            A Studio account lets a partner business (for example, an indoor golf simulator studio, country
            club, or golf course) offer its members a private, studio-branded leaderboard inside Golfable.
            Studio accounts are set up directly by Golfable and are billed separately from individual member
            subscriptions, under terms agreed with the studio's account owner. A studio's members are not
            individually billed for that studio's access.
          </p>
        </Section>

        <Section title="8. Your Content">
          <p>
            You keep ownership of the content you submit to Golfable — your scores, profile information, and
            any photo you upload. By submitting content, you grant Golfable a non-exclusive, worldwide,
            royalty-free license to use, display, and store it as needed to operate the Service — for example,
            showing your name and score on a leaderboard you're part of. Profile photos are private by default
            and are shown only to you unless we clearly state otherwise in the product.
          </p>
        </Section>

        <Section title="9. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Submit false scores or otherwise manipulate leaderboards or Challenge Mode results;</li>
            <li>Use the Service for any unlawful purpose, or to harass, abuse, or harm another member;</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or our systems;</li>
            <li>Interfere with or disrupt the Service, or bypass any rate limits or access controls;</li>
            <li>Resell, sublicense, or commercially exploit the Service without our written permission.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate this section.</p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            The Service — including its design, features, drill library, and branding — is owned by Golfable
            LLC and protected by applicable intellectual property laws. These Terms don't grant you any right
            to use our name, logo, or branding without our prior written consent.
          </p>
        </Section>

        <Section title="11. Third-Party Services">
          <p>
            We rely on third-party service providers to operate Golfable — for example, to host data, send
            notifications, and process payments. Your use of the Service is also subject to those providers'
            own applicable terms where you interact with them directly (such as a payment processor's checkout
            page).
          </p>
        </Section>

        <Section title="12. Disclaimer of Warranties">
          <p>
            The Service is provided "as is" and "as available," without warranties of any kind, express or
            implied. We don't guarantee the Service will be uninterrupted, error-free, or that it will meet
            your specific expectations. Golfable is a practice tool, not medical, fitness, or professional
            coaching advice.
          </p>
        </Section>

        <Section title="13. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Golfable LLC will not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of the Service. Our total
            liability for any claim relating to the Service is limited to the amount you paid us in the 12
            months before the claim arose.
          </p>
        </Section>

        <Section title="14. Termination">
          <p>
            You may stop using the Service and delete your account at any time. We may suspend or terminate
            your access if you violate these Terms, or if we discontinue the Service, with notice where
            reasonably practical.
          </p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we'll notify you (for
            example, by email or an in-app notice) before they take effect. Continuing to use the Service after
            changes take effect means you accept the updated Terms.
          </p>
        </Section>

        <Section title="16. Governing Law">
          <p>
            These Terms are governed by the laws of the State of [YOUR STATE], without regard to its conflict
            of law principles, unless otherwise required by the law of your jurisdiction.
          </p>
        </Section>

        <Section title="17. Contact Us">
          <p>
            Questions about these Terms? Reach us at{" "}
            <a href="mailto:support@golfable.co" className="text-brand underline">
              support@golfable.co
            </a>
            .
          </p>
        </Section>
      </main>
    </div>
  );
}
