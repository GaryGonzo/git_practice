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

      <div className="mt-6 flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">This Week</p>
          <p className="font-display text-2xl">
            {sessionsThisWeek}/{profile.weekly_goal} Golfables
          </p>
        </div>
        <WeeklyGoalRing completed={sessionsThisWeek} goal={profile.weekly_goal} size={64} />
      </div>

      {loading ? (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 text-center font-body text-neutral-500">
          Loading…
        </div>
      ) : drill ? (
        <Link
          to="/app/today"
          className="mt-4 block overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm active:bg-neutral-50"
        >
          <div className={`px-4 py-3 text-white ${CATEGORY_BG[drill.category]}`}>
            <p className="font-label text-xs font-semibold tracking-widest text-white/80 uppercase">
              {CATEGORY_INFO[drill.category].label} · Today's Golfable
            </p>
            <h2 className="font-display text-2xl tracking-wide">{drill.name}</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-body text-sm text-neutral-600">
              {score === null ? "Play it now and log your score" : `You scored ${score}/${maxScore}`}
            </p>
            <span className="font-label text-brand text-sm font-semibold">{score === null ? "Play →" : "View →"}</span>
          </div>
        </Link>
      ) : (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 text-center font-body text-neutral-500">
          No Golfable scheduled for today yet — check back soon.
        </div>
      )}

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
