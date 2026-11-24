import { useState } from "react";
import type { Badge, BadgeIcon, Trend } from "../../lib/golfableInsights";

// Small pieces for Golfable's progress features: a score sparkline, badge
// medals and the badge shelf.

const GREEN = "#1f4d36";
const GOLD = "#c6a64b";

/** Recent scores as a little line, best point in gold, latest dot solid. */
export function Sparkline({ trend, lower, className = "h-10 w-28" }: { trend: Trend; lower?: boolean; className?: string }) {
  const s = trend.scores;
  const W = 112;
  const H = 40;
  const min = Math.min(...s);
  const max = Math.max(...s);
  const span = max - min || 1;
  const x = (i: number) => (s.length === 1 ? W / 2 : 4 + (i * (W - 8)) / (s.length - 1));
  // Higher on the chart = better, whichever way the drill scores.
  const y = (v: number) => {
    const u = (v - min) / span;
    return 6 + (lower ? u : 1 - u) * (H - 12);
  };
  const d = s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const bestI = s.lastIndexOf(trend.best);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-label={`Recent scores: ${s.join(", ")}`} role="img">
      <path d={d} fill="none" stroke={GREEN} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      {s.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === s.length - 1 ? 3.6 : 2} fill={i === bestI ? GOLD : i === s.length - 1 ? GREEN : "#fff"} stroke={GREEN} strokeWidth={1.4} />
      ))}
    </svg>
  );
}

function Glyph({ icon }: { icon: BadgeIcon }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "flag":
      return (
        <g {...p}>
          <path d="M13 31V9" />
          <path d="M13 10l13 4.5L13 19z" fill="currentColor" />
        </g>
      );
    case "flame":
      return <path {...p} d="M20 31c-5 0-8-3.5-8-8 0-5 5-7 5-13 4 2.5 6 5 6.5 8.5 1-1 1.7-2.2 2-3.5 2 2 2.5 4.5 2.5 8 0 4.5-3 8-8 8z" fill="currentColor" />;
    case "star":
      return <path {...p} d="M20 9l3.3 6.9 7.5.9-5.5 5.2 1.4 7.5L20 25.8l-6.7 3.7 1.4-7.5-5.5-5.2 7.5-.9z" fill="currentColor" />;
    case "compass":
      return (
        <g {...p}>
          <circle cx={20} cy={20} r={10} />
          <path d="M24 16l-2.5 5.5L16 24l2.5-5.5z" fill="currentColor" />
        </g>
      );
    case "target":
      return (
        <g {...p}>
          <circle cx={20} cy={20} r={10} />
          <circle cx={20} cy={20} r={5} />
          <circle cx={20} cy={20} r={1.2} fill="currentColor" />
        </g>
      );
    case "sun":
      return (
        <g {...p}>
          <circle cx={20} cy={20} r={5} fill="currentColor" />
          <path d="M20 8v3M20 29v3M8 20h3M29 20h3M11.5 11.5l2 2M26.5 26.5l2 2M28.5 11.5l-2 2M13.5 26.5l-2 2" />
        </g>
      );
    case "moon":
      return <path {...p} d="M25 28a10 10 0 1 1-6-18 8 8 0 0 0 6 18z" fill="currentColor" />;
    case "trophy":
      return (
        <g {...p}>
          <path d="M14 10h12v6a6 6 0 0 1-12 0z" fill="currentColor" />
          <path d="M14 12h-3a3 3 0 0 0 3 5M26 12h3a3 3 0 0 1-3 5M20 22v5M15 30h10" />
        </g>
      );
    case "putter":
      return (
        <g {...p}>
          <path d="M23 9l-4 19" />
          <path d="M13 28h8" strokeWidth={4} />
          <circle cx={28} cy={28} r={2.6} fill="currentColor" stroke="none" />
        </g>
      );
    case "calendar":
      return (
        <g {...p}>
          <rect x={10} y={12} width={20} height={18} rx={3} />
          <path d="M10 17h20M15 9v5M25 9v5" />
          <path d="M16 23l3 3 5-6" />
        </g>
      );
    case "ball":
      return (
        <g {...p}>
          <circle cx={20} cy={20} r={10} />
          <circle cx={17} cy={17} r={1} fill="currentColor" />
          <circle cx={22} cy={16} r={1} fill="currentColor" />
          <circle cx={16} cy={22} r={1} fill="currentColor" />
          <circle cx={21} cy={21} r={1} fill="currentColor" />
          <circle cx={25} cy={20} r={1} fill="currentColor" />
          <circle cx={20} cy={25} r={1} fill="currentColor" />
        </g>
      );
  }
}

export function BadgeMedal({ badge, size = 56, fresh = false }: { badge: Badge; size?: number; fresh?: boolean }) {
  const on = badge.earned;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label={`${badge.name}${on ? "" : " (locked)"}`} className={fresh ? "animate-[bounce_1s_ease-in-out_2]" : undefined}>
      <circle cx={20} cy={20} r={18.5} fill={on ? GOLD : "#e7e5df"} />
      <circle cx={20} cy={20} r={15} fill={on ? GREEN : "#f3f2ee"} stroke={on ? "#e5cf86" : "#dddad2"} strokeWidth={1.2} />
      {!on && badge.progress > 0 && (
        <circle
          cx={20}
          cy={20}
          r={18.5}
          fill="none"
          stroke={GREEN}
          strokeWidth={2.4}
          strokeDasharray={`${(badge.progress * 116.2).toFixed(1)} 200`}
          transform="rotate(-90 20 20)"
          opacity={0.6}
        />
      )}
      <g color={on ? "#f4ecd2" : "#b9b5aa"}>
        <Glyph icon={badge.icon} />
      </g>
    </svg>
  );
}

/** Earned badges first; tap one to see what it's for. */
export function BadgeShelf({ badges, className = "mt-4" }: { badges: Badge[] | null; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  if (!badges) return <div className={`${className} h-32 animate-pulse rounded-2xl bg-white ring-1 ring-black/[0.06]`} />;
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned).sort((a, b) => b.progress - a.progress);
  const shown = all ? [...earned, ...locked] : [...earned, ...locked].slice(0, 8);
  const sel = badges.find((b) => b.id === open);
  return (
    <section className={`${className} rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-label text-lg font-semibold text-neutral-800">Badges</h2>
        <p className="font-label text-sm font-semibold text-neutral-500">
          {earned.length} of {badges.length}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
        {shown.map((b) => (
          <button key={b.id} type="button" onClick={() => setOpen(open === b.id ? null : b.id)} className="flex flex-col items-center gap-1" aria-expanded={open === b.id}>
            <BadgeMedal badge={b} />
            <span className={`font-label text-center text-[0.72rem] leading-tight font-semibold ${b.earned ? "text-neutral-800" : "text-neutral-400"}`}>{b.name}</span>
          </button>
        ))}
      </div>
      {sel && (
        <p className="font-body mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          <span className="font-semibold">{sel.name}:</span> {sel.desc} {sel.earned ? "Earned." : sel.progress > 0 ? `${Math.round(sel.progress * 100)}% there.` : ""}
        </p>
      )}
      {badges.length > 8 && (
        <button type="button" onClick={() => setAll(!all)} className="font-label text-brand mt-3 w-full text-center text-sm font-semibold">
          {all ? "Show fewer" : `See all ${badges.length}`}
        </button>
      )}
    </section>
  );
}
