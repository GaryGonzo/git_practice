import { useEffect, useState } from "react";
import {
  getFitStreaks,
  countCompletedWorkoutsBetween,
  mondayOfISO,
  todayISO,
  type FitStreaks,
} from "../lib/golfableApi";
import { WeeklyGoalRing } from "./WeeklyGoalRing";
import { CelebrationToast } from "./CelebrationToast";

function StreakStat({ label, value, unit, note }: { label: string; value: number; unit: string; note?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="font-label text-sm font-semibold text-neutral-500">{label}</p>
      <p className="font-display text-3xl leading-none text-neutral-900">
        {value} <span className="font-label text-sm text-neutral-400">{unit}</span>
      </p>
      {note && <p className="font-label text-xs font-semibold text-amber-600">{note}</p>}
    </div>
  );
}

// Training + nutrition streaks with this week's sessions on the ring.
// refreshKey lets the parent re-check after a nutrition entry changes, so
// a milestone toast fires the moment it's earned.
export function FitStreaksPanel({ userId, sessionsPerWeek, refreshKey }: { userId: string; sessionsPerWeek: number; refreshKey: number }) {
  const [streaks, setStreaks] = useState<FitStreaks | null>(null);
  const [weekDone, setWeekDone] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const today = todayISO();
    Promise.all([getFitStreaks(userId), countCompletedWorkoutsBetween(userId, mondayOfISO(today), today)])
      .then(([s, done]) => {
        setStreaks(s);
        setWeekDone(done);
        if (s.newBadges.length > 0) setToast(`${s.newBadges.map((b) => b.label).join(" + ")}!`);
      })
      .catch(() => {
        // Streak tables missing (0067 not applied yet) -- just hide the panel.
        setStreaks(null);
      });
  }, [userId, refreshKey]);

  if (!streaks) return null;

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
      <div className="flex items-center gap-4">
        <WeeklyGoalRing completed={weekDone} goal={sessionsPerWeek} size={72} />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <StreakStat
            label="Training streak"
            value={streaks.training.sessions}
            unit={streaks.training.sessions === 1 ? "session" : "sessions"}
            note={streaks.training.onThinIce ? "Missed one -- don't miss the next" : null}
          />
          <StreakStat label="Weeks" value={streaks.training.weeks} unit="in a row" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3">
        <StreakStat label="Protein" value={streaks.protein.length} unit="days" />
        <StreakStat label="Kitchen by 8" value={streaks.kitchen.length} unit="days" />
        <StreakStat label="Water" value={streaks.water.length} unit="days" />
      </div>
      {toast && <CelebrationToast message={toast} particles={["🥩", "💧", "🌙", "🏆"]} onDone={() => setToast(null)} />}
    </div>
  );
}
