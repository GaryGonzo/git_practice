import { consistency, weekStart } from "../lib/fitConsistency";
import { todayISO } from "../lib/golfableApi";

// Consistency at a glance: this week against the goal, the week streak, a
// running total and the last 4 weeks as a grid of days. Shared by Golfable
// practice and Golfable Fit.

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export function ConsistencyCard({
  dates,
  goal,
  noun,
  totalLabel,
  total,
  className = "mt-4",
}: {
  /** One entry per day done (duplicates count as more than one). Null while loading. */
  dates: string[] | null;
  goal: number;
  /** "Workouts", "Practice days"... used for the screen-reader label. */
  noun: string;
  totalLabel: string;
  /** Override the third number (defaults to how many dates were passed). */
  total?: number;
  className?: string;
}) {
  if (!dates) return <div className={`${className} h-40 animate-pulse rounded-2xl bg-white ring-1 ring-black/[0.06]`} />;
  const today = todayISO();
  const c = consistency(dates, today, 4, goal);
  return (
    <section className={`${className} rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-label text-lg font-semibold text-neutral-800">Consistency</h2>
        <p className="font-label text-sm font-semibold text-neutral-500">Goal: {goal}+ a week</p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          { v: `${c.thisWeek}`, l: "this week", hot: c.thisWeek >= goal },
          { v: `${c.weekStreak}`, l: c.weekStreak === 1 ? "week streak" : "weeks streak", hot: c.weekStreak > 0 },
          { v: `${total ?? c.total}`, l: totalLabel, hot: false },
        ].map((x) => (
          <div key={x.l} className="rounded-xl bg-neutral-50 py-2">
            <p className={`font-display text-3xl leading-none ${x.hot ? "text-brand" : "text-neutral-800"}`}>{x.v}</p>
            <p className="font-label text-xs font-semibold text-neutral-500">{x.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5" aria-label={`${noun} over the last 4 weeks`}>
        <div className="grid grid-cols-[3.2rem_repeat(7,1fr)] gap-1.5">
          <span />
          {DOW.map((d, i) => (
            <span key={i} className="font-label text-center text-[0.7rem] font-semibold text-neutral-400">
              {d}
            </span>
          ))}
        </div>
        {c.weeks.map((w) => (
          <div key={w.start} className="grid grid-cols-[3.2rem_repeat(7,1fr)] items-center gap-1.5">
            <span className={`font-label text-xs font-semibold ${w.start === weekStart(today) ? "text-neutral-800" : "text-neutral-400"}`}>
              {w.start === weekStart(today) ? "This wk" : new Date(`${w.start}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            {w.days.map((d) => (
              <span
                key={d.date}
                title={d.date}
                className={`mx-auto h-6 w-full max-w-7 rounded-md ${
                  d.count > 0 ? "bg-brand" : d.future ? "bg-neutral-50" : d.date === today ? "ring-brand/40 bg-neutral-100 ring-2" : "bg-neutral-100"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
