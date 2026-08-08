import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</div>;
}

export function CTAButton({
  to,
  href,
  variant = "primary",
  children,
  className = "",
}: {
  to?: string;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-[15px] font-semibold tracking-wide transition-colors";
  const styles = {
    primary: "bg-gold text-fairway-dark hover:bg-gold-light",
    secondary: "bg-fairway text-cream hover:bg-fairway-light",
    ghost: "border border-fairway/30 text-fairway hover:border-fairway hover:bg-fairway/5",
  }[variant];
  const cls = `${base} ${styles} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light/90 sm:text-sm">
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <div
          className={`mb-3 text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm ${
            dark ? "text-gold-light" : "text-gold"
          }`}
        >
          {eyebrow}
        </div>
      )}
      <h2
        className={`font-display text-3xl leading-tight sm:text-4xl ${
          dark ? "text-cream" : "text-fairway-dark"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 max-w-2xl text-lg leading-relaxed ${dark ? "text-cream/80" : "text-ink/70"} ${align === "center" ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Section({
  className = "",
  dark = false,
  children,
}: {
  className?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`py-16 sm:py-24 ${dark ? "bg-fairway-dark text-cream" : ""} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-md border border-sand bg-white/60 p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PillarCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-white">
      <div className="font-display text-3xl text-gold">{number}</div>
      <h3 className="mt-2 text-lg font-semibold text-fairway-dark">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{description}</p>
    </Card>
  );
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-sand bg-white/70 px-6 py-5 text-center">
      <div className="font-display text-3xl text-fairway-dark sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ink/60">{label}</div>
    </div>
  );
}

export function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  return (
    <details className="group border-b border-sand py-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-fairway-dark">
        {q}
        <span className="shrink-0 text-2xl leading-none text-gold transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink/70">{a}</div>
    </details>
  );
}

export function WeekCard({
  week,
  title,
  children,
}: {
  week: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-5 border-b border-sand py-8 last:border-b-0">
      <div className="shrink-0">
        <div className="font-display text-sm uppercase tracking-wide text-gold">{week}</div>
      </div>
      <div>
        <h3 className="font-display text-2xl text-fairway-dark">{title}</h3>
        <div className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/70">{children}</div>
      </div>
    </div>
  );
}
