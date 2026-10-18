import { Link } from "react-router-dom";

// Shared building blocks so every screen uses the same three patterns:
//   - a dark "fairway" hero for the one thing that matters most on a screen
//   - grouped panels (one container, rows divided by hairlines) instead of
//     a stack of separate boxes
//   - sentence-case section titles instead of tracked all-caps eyebrows

export function ChevronRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Screen title block: small muted kicker line, big display title, optional trailing slot. */
export function PageHeader({
  kicker,
  title,
  sub,
  right,
  back,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="pt-5">
      {back && (
        <Link to={back.to} className="font-label -ml-1 mb-2 inline-flex items-center gap-0.5 text-base font-semibold text-neutral-500">
          <ChevronLeft className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {kicker && <p className="font-label text-base font-medium text-neutral-500">{kicker}</p>}
          <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-wide text-neutral-900">{title}</h1>
          {sub && <p className="font-body mt-1.5 text-sm text-neutral-500">{sub}</p>}
        </div>
        {right && <div className="flex-none">{right}</div>}
      </div>
    </header>
  );
}

/** A titled group of content. Titles are sentence case, not eyebrows. */
export function Section({
  title,
  action,
  children,
  className = "mt-7",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          {title && <h2 className="font-label text-xl font-semibold text-neutral-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** One container; rows inside are separated by hairlines. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] ${className}`}>
      {children}
    </div>
  );
}

/** A list row: leading icon, title + sub, trailing value or chevron. Renders a Link, button, or div. */
export function Row({
  to,
  onClick,
  icon,
  title,
  sub,
  trailing,
  chevron,
  className = "",
}: {
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      {icon && <span className="flex flex-none items-center justify-center">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="font-label block text-[1.05rem] leading-tight font-semibold text-neutral-900">{title}</span>
        {sub && <span className="font-body mt-0.5 block text-sm text-neutral-500">{sub}</span>}
      </span>
      {trailing && <span className="flex-none">{trailing}</span>}
      {(chevron ?? Boolean(to || onClick)) && <ChevronRight className="h-4 w-4 flex-none text-neutral-300" />}
    </>
  );
  const cls = `flex w-full items-center gap-3 px-4 py-3.5 text-left ${to || onClick ? "active:bg-neutral-50" : ""} ${className}`;
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

/** Round icon tile used as a Row's leading element. */
export function IconDot({ children, className = "bg-brand/10 text-brand" }: { children: React.ReactNode; className?: string }) {
  return <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}>{children}</span>;
}

/** The dark green hero, striped like a freshly mown fairway. */
export function FairwayPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-brand-dark relative overflow-hidden rounded-3xl text-white ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0 34px, rgba(255,255,255,0) 34px 68px), radial-gradient(120% 90% at 100% 0%, rgba(31,77,54,0.9) 0%, rgba(20,32,27,0) 70%)",
      }}
    >
      {children}
    </div>
  );
}

/** A thin progress meter. */
export function Meter({ value, max, tone = "bg-brand", track = "bg-neutral-100" }: { value: number; max: number; tone?: string; track?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-1.5 overflow-hidden rounded-full ${track}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={`h-full rounded-full transition-[width] duration-500 ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
