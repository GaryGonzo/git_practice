import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { GolfableMark } from "../../components/GolfableMark";
import {
  getDrillForDate,
  getMyScoreForDate,
  getFitRoutineForDate,
  getFitRoutineChecks,
  todayISO,
  type FitRoutineItem,
} from "../../lib/golfableApi";

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 21V3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 4l10 4-10 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <ellipse cx="7" cy="21" rx="4" ry="1.1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BarbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 12h2M19.5 12h2M8.5 12h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="4.5" y="8" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="15.5" y="8" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function pacificNowHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function greeting(): string {
  const hour = Number(pacificNowHHMM().slice(0, 2));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Where the app opens for anyone with Golfable Fit: two doors, each
// showing the one thing waiting behind it, so picking one is a glance.
export function LauncherScreen() {
  const { profile } = useAuth();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [played, setPlayed] = useState(false);
  const [nextItem, setNextItem] = useState<FitRoutineItem | null>(null);
  const [fitProgress, setFitProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!profile) return;
    const today = todayISO();
    getDrillForDate(today).then(async (found) => {
      setDrill(found?.drill ?? null);
      if (found) setPlayed((await getMyScoreForDate(profile.id, found.drill.id, today)) !== null);
    });
    Promise.all([getFitRoutineForDate(profile.id, today), getFitRoutineChecks(profile.id, today)]).then(([items, checks]) => {
      if (items.length === 0) return;
      const now = pacificNowHHMM();
      setFitProgress({ done: items.filter((i) => checks.has(i.id)).length, total: items.length });
      setNextItem(items.find((i) => !checks.has(i.id) && i.timeOfDay !== null && i.timeOfDay >= now) ?? null);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="bg-brand-dark flex min-h-screen flex-col px-5 pt-10 pb-8 text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          <GolfableMark tone="on-dark" className="h-8 w-auto" />
          <Link
            to="/app/profile"
            className="font-label rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/80"
          >
            Profile
          </Link>
        </div>

        <p className="font-label mt-10 text-lg font-medium text-white/55">{greeting()}</p>
        <h1 className="font-display text-5xl leading-none tracking-wide">{profile.first_name}</h1>

        <div className="mt-8 flex flex-1 flex-col gap-4">
          <Link
            to="/app/golf"
            className="group bg-brand relative flex min-h-48 flex-1 flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-xl shadow-black/30 transition active:scale-[0.98]"
            style={{ backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.045) 0 34px, rgba(255,255,255,0) 34px 68px)" }}
          >
            <FlagIcon className="absolute -top-4 -right-6 h-44 w-44 text-white/[0.07]" />
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <FlagIcon className="h-5 w-5" />
              </span>
              <span className="font-label text-base font-semibold text-white/70">Skills</span>
            </div>
            <div>
              <h2 className="font-display text-5xl leading-none tracking-wide">Golfable</h2>
              <p className="font-body mt-2 text-sm text-white/80">
                {drill ? `${played ? "Done today" : "Today"}: ${drill.name}` : "Drills, rounds, leaderboard"}
              </p>
            </div>
            <span className="font-label inline-flex items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-sm font-bold text-brand">
              {drill && !played ? "Play today's Golfable" : "Open"}
              <ArrowIcon className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/app/fit/today"
            className="group bg-gold relative flex min-h-48 flex-1 flex-col justify-between overflow-hidden rounded-3xl p-6 text-brand-dark shadow-xl shadow-black/30 transition active:scale-[0.98]"
          >
            <BarbellIcon className="absolute -right-8 -bottom-10 h-48 w-48 text-brand-dark/[0.07]" />
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="bg-brand-dark/10 flex h-9 w-9 items-center justify-center rounded-full">
                  <BarbellIcon className="h-5 w-5" />
                </span>
                <span className="font-label text-brand-dark/70 text-base font-semibold">Body</span>
              </span>
              {fitProgress && (
                <span className="font-label bg-brand-dark/10 rounded-full px-2.5 py-1 text-xs font-semibold">
                  {fitProgress.done}/{fitProgress.total} today
                </span>
              )}
            </div>
            <div>
              <h2 className="font-display text-5xl leading-none tracking-wide">Golfable Fit</h2>
              <p className="font-body text-brand-dark/80 mt-2 text-sm">
                {nextItem && nextItem.timeOfDay
                  ? `Up next: ${nextItem.title} · ${formatTime12h(nextItem.timeOfDay)}`
                  : "Today's plan, training, check-in"}
              </p>
            </div>
            <span className="font-label bg-brand-dark inline-flex items-center gap-1.5 self-start rounded-full px-4 py-2 text-sm font-bold text-white">
              Today's plan
              <ArrowIcon className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
