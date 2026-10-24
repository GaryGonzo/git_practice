import { useEffect, useState } from "react";
import {
  getFitStreaks,
  countCompletedWorkoutsBetween,
  mondayOfISO,
  todayISO,
  type FitStreaks,
} from "../lib/golfableApi";
import { NUTRITION_MILESTONES } from "../lib/fitStreaks";
import { WeeklyGoalRing } from "./WeeklyGoalRing";
import { CelebrationToast } from "./CelebrationToast";
import { PanelError, PanelSkeleton } from "./FitPanelStates";

function StreakStat({ label, value, unit, note }: { label: string; value: number; unit: string; note?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="font-label text-sm font-semibold text-neutral-500">{label}</p>
      <p className="font-display text-3xl leading-none text-neutral-900">
        {value} <span className="font-label text-sm text-neutral-400">{unit}</span>
      </p>
      {note && <p className="font-label text-xs font-semibold text-neutral-500">{note}</p>}
    </div>
  );
}

// "4 to 7-day badge" for the next nutrition milestone, null once all are earned.
function nextBadgeNote(days: number): string | null {
  const next = NUTRITION_MILESTONES.find((m) => m > days);
  return next ? `${next - days} to ${next}-day badge` : null;
}

// Training + nutrition streaks with this week's sessions on the ring.
// refreshKey lets the parent re-check after a nutrition entry changes, so
// a milestone toast fires the moment it's earned.
export function FitStreaksPanel({ userId, sessionsPerWeek, refreshKey }: { userId: string; sessionsPerWeek: number; refreshKey: number }) {
  const [streaks, setStreaks] = useState<FitStreaks | null>(null);
  const [weekDone, setWeekDone] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const today = todayISO();
    Promise.all([getFitStreaks(userId), countCompletedWorkoutsBetween(userId, mondayOfISO(today), today)])
      .then(([s, done]) => {
        setStreaks(s);
        setWeekDone(done);
        setState("ready");
        if (s.newBadges.length > 0) setToast(`${s.newBadges.map((b) => b.label).join(" + ")}!`);
      })
      .catch(() => setState((prev) => (prev === "ready" ? prev : "error")));
  }, [userId, refreshKey, retryKey]);

  if (state === "loading" && !streaks) return <PanelSkeleton className="mt-4" label="Loading streaks" />;
  if (!streaks)
    return (
      <PanelError
        className="mt-4"
        message="Couldn't load your streaks. They're safe, just not showing."
        onRetry={() => {
          setState("loading");
          setRetryKey((k) => k + 1);
        }}
      />
    );

  const thinIce = streaks.training.onThinIce;
  const left = Math.max(sessionsPerWeek - weekDone, 0);

  return (
    <div className={`mt-4 rounded-2xl bg-white p-4 ring-1 ${thinIce ? "ring-2 ring-amber-400" : "ring-black/[0.06]"}`}>
      {thinIce && (
        <p className="font-label mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          🧊 Thin ice: you missed one. Don't miss the next session.
        </p>
      )}
      <div className="flex items-center gap-4">
        <WeeklyGoalRing completed={weekDone} goal={sessionsPerWeek} size={72} />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <StreakStat
            label="Training streak"
            value={streaks.training.sessions}
            unit={streaks.training.sessions === 1 ? "session" : "sessions"}
            note={left > 0 ? `${left} more this week` : "Week done"}
          />
          <StreakStat label="Weeks" value={streaks.training.weeks} unit="in a row" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3">
        <StreakStat label="Protein" value={streaks.protein.length} unit="days" note={nextBadgeNote(streaks.protein.length)} />
        <StreakStat label="Kitchen by 8" value={streaks.kitchen.length} unit="days" note={nextBadgeNote(streaks.kitchen.length)} />
        <StreakStat label="Water" value={streaks.water.length} unit="days" note={nextBadgeNote(streaks.water.length)} />
      </div>
      {toast && <CelebrationToast message={toast} particles={["🥩", "💧", "🌙", "🏆"]} onDone={() => setToast(null)} />}
    </div>
  );
}
