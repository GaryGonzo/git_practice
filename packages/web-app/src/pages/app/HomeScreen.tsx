import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO } from "@golfable/shared";
import type { Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { WeeklyGoalRing } from "../../components/WeeklyGoalRing";
import { getDrillForDate, getMyScoreForDate, getSessionsThisWeek, todayISO } from "../../lib/golfableApi";

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [maxScore, setMaxScore] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const found = await getDrillForDate(todayISO());
      if (found) {
        setDrill(found.drill);
        setMaxScore(found.maxScore);
        setScore(await getMyScoreForDate(profile.id, found.drill.id, todayISO()));
      } else {
        setDrill(null);
      }
      setSessionsThisWeek(await getSessionsThisWeek(profile.id));
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">Welcome back</p>
      <h1 className="font-display text-3xl tracking-wide">{profile.first_name}</h1>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center font-body text-neutral-500">
          Loading…
        </div>
      ) : drill ? (
        <Link
          to="/app/today"
          className="mt-6 block overflow-hidden rounded-2xl shadow-lg shadow-black/10 transition active:scale-[0.99] active:shadow-md"
        >
          <div className={`px-5 pt-5 pb-6 text-white ${CATEGORY_BG[drill.category]}`}>
            <p className="font-label text-xs font-semibold tracking-widest text-white/80 uppercase">
              {CATEGORY_INFO[drill.category].label} · Today's Golfable
            </p>
            <h2 className="font-display mt-1 text-4xl leading-tight tracking-wide">{drill.name}</h2>
          </div>
          <div className="flex items-center justify-between bg-white px-5 py-4">
            <p className="font-body text-sm text-neutral-600">
              {score === null ? "Play it now and log your score" : `You scored ${score}/${maxScore}`}
            </p>
            <span
              className={`font-label inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white ${CATEGORY_BG[drill.category]}`}
            >
              {score === null ? "Play" : "View"}
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center font-body text-neutral-500">
          No Golfable scheduled for today yet — check back soon.
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">This Week</p>
          <p className="font-display text-2xl">
            {sessionsThisWeek}/{profile.weekly_goal} Golfables
          </p>
        </div>
        <WeeklyGoalRing completed={sessionsThisWeek} goal={profile.weekly_goal} size={64} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/app/library" className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-label text-sm font-semibold">Library</p>
          <p className="font-body text-xs text-neutral-500">Catch up on past Golfables</p>
        </Link>
        <Link to="/app/progress" className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-label text-sm font-semibold">Progress</p>
          <p className="font-body text-xs text-neutral-500">See your trend over time</p>
        </Link>
      </div>
    </div>
  );
}
