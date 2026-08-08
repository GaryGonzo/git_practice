import { CTAButton, Section } from "../components/ui";

export function NotFound() {
  return (
    <Section className="text-center">
      <div className="font-display text-5xl text-fairway-dark">404</div>
      <p className="mt-4 text-lg text-ink/70">That page doesn't exist.</p>
      <div className="mt-8">
        <CTAButton to="/">Back to Home</CTAButton>
      </div>
    </Section>
  );
}
