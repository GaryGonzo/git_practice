import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFitDailyLogs, todayISO, type FitDailyLog } from "../lib/golfableApi";
import {
  MINI_GOALS,
  addDays,
  drinkNights,
  goalFor,
  harperSummary,
  mondayOf,
  nutritionStore,
  pickGoal,
  weekProgress,
  weeksHitStreak,
  type MiniGoalId,
} from "../lib/nutritionGoals";
import { copyText } from "../lib/clipboard";
import { Meter } from "./ui";
import { CelebrationToast } from "./CelebrationToast";
import { PanelError, PanelSkeleton } from "./FitPanelStates";

// This week's one nutrition mini-goal. Reads existing daily habit logs;
// the goal pick, drink nights and prep live in localStorage (no DB change).
// `withHarperCopy` adds the weekly "Copy for Harper" check-in button.
export function FitNutritionWeekCard({
  userId,
  weekStart: weekStartProp,
  refreshKey = 0,
  withHarperCopy = false,
}: {
  userId: string;
  weekStart?: string;
  refreshKey?: number;
  withHarperCopy?: boolean;
}) {
  const today = todayISO();
  const weekStart = weekStartProp ?? mondayOf(today);
  const [logs, setLogs] = useState<FitDailyLog[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [picking, setPicking] = useState(false);
  const [bump, setBump] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    setFailed(false);
    getFitDailyLogs(userId, addDays(mondayOf(today), -7 * 26), addDays(weekStart, 6))
      .then(setLogs)
      .catch(() => setFailed(true));
  }, [userId, weekStart, today, refreshKey, retry]);

  const progress = logs ? weekProgress(weekStart, logs, today) : null;
  const streak = logs ? weeksHitStreak(logs, today) : 0;

  // Celebrate once per week the first time the goal is hit.
  useEffect(() => {
    if (!progress?.hit) return;
    const k = `celebrated.${weekStart}`;
    if (nutritionStore.read<boolean>(k, false)) return;
    nutritionStore.write(k, true);
    setToast(`Mini-goal hit: ${progress.goal.short}!`);
  }, [progress?.hit, progress?.goal.short, weekStart]);

  if (failed) return <PanelError className="mt-4" message="Couldn't load this week's nutrition goal." onRetry={() => setRetry((r) => r + 1)} />;
  if (!progress) return <PanelSkeleton className="mt-4" label="Loading nutrition goal" rows={1} />;

  const { goal, count, hit } = progress;
  const isDrinks = goal.id === "drinks";
  const isPrep = goal.id === "prep";
  const isCurrent = weekStart === mondayOf(today);

  function choose(id: MiniGoalId) {
    pickGoal(weekStart, id);
    setPicking(false);
    setBump((b) => b + 1);
  }

  function toggleDrinkToday() {
    const k = `drinks.${weekStart}`;
    const nights = drinkNights(weekStart);
    nutritionStore.write(k, nights.includes(today) ? nights.filter((d) => d !== today) : [...nights, today]);
    setBump((b) => b + 1);
  }

  function markPrep() {
    nutritionStore.write(`prepDone.${weekStart}`, true);
    setBump((b) => b + 1);
  }

  async function handleCopy() {
    const text = harperSummary(weekStart, progress!, streak);
    const ok = await copyText(text);
    if (ok) {
      setCopied("copied");
      setFallback(null);
      setTimeout(() => setCopied("idle"), 2500);
    } else {
      setCopied("failed");
      setFallback(text);
    }
  }

  const status = isDrinks
    ? `${count} drink night${count === 1 ? "" : "s"} so far (1 max)`
    : isPrep
      ? hit
        ? "Prep done"
        : "Not done yet"
      : `${Math.min(count, goal.target)}/${goal.target} ${goal.unit}`;

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]" data-bump={bump}>
      {toast && <CelebrationToast message={toast} particles={["🥗", "💧", "🔥", "✨"]} onDone={() => setToast(null)} />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label text-sm font-semibold text-neutral-500">This week's nutrition goal</p>
          <p className="font-label text-lg leading-tight font-semibold text-neutral-900">{goal.label}</p>
        </div>
        {hit && <span className="font-label bg-gold/20 text-brand-dark shrink-0 rounded-full px-3 py-1 text-sm font-bold">Hit ✓</span>}
      </div>
      <div className="mt-3">
        <Meter value={isDrinks ? (count <= 1 ? 1 : 0) : Math.min(count, goal.target)} max={isDrinks ? 1 : goal.target} />
        <div className="mt-1 flex justify-between">
          <p className="font-label text-sm font-semibold text-neutral-600">{status}</p>
          <p className="font-label text-sm font-semibold text-neutral-500">
            {streak > 0 ? `🔥 ${streak} week${streak === 1 ? "" : "s"} in a row` : "Hit it to start a run"}
          </p>
        </div>
      </div>

      {isCurrent && isDrinks && (
        <button type="button" onClick={toggleDrinkToday} className="font-label bg-brand/10 text-brand mt-3 min-h-11 w-full rounded-full text-sm font-bold">
          {drinkNights(weekStart).includes(today) ? "Undo: drinks tonight" : "Log tonight as a drink night"}
        </button>
      )}
      {isPrep && !hit && (
        <button type="button" onClick={markPrep} className="font-label bg-brand/10 text-brand mt-3 min-h-11 w-full rounded-full text-sm font-bold">
          Mark Sunday prep done
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <Link to="/app/fit/fuel" className="font-label bg-brand-dark text-gold flex min-h-11 flex-1 items-center justify-center rounded-full text-sm font-bold">
          Fuel plan →
        </Link>
        <button
          type="button"
          onClick={() => setPicking((p) => !p)}
          aria-expanded={picking}
          className="font-label min-h-11 rounded-full px-4 text-sm font-bold text-neutral-600 ring-1 ring-black/10"
        >
          {picking ? "Close" : "Change goal"}
        </button>
      </div>
      {picking && (
        <div className="mt-3 space-y-2" role="group" aria-label="Pick this week's goal">
          {MINI_GOALS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => choose(g.id)}
              aria-pressed={g.id === goal.id}
              className={`font-label block min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold ${g.id === goal.id ? "bg-brand text-white" : "bg-neutral-50 text-neutral-800 ring-1 ring-black/[0.06]"}`}
            >
              {g.label}
            </button>
          ))}
          <p className="font-body text-xs text-neutral-500">Leave it and the goal rotates each week on its own.</p>
        </div>
      )}

      {withHarperCopy && (
        <>
          <button type="button" onClick={handleCopy} className="font-label mt-3 min-h-11 w-full rounded-full text-sm font-bold text-brand ring-1 ring-brand/30">
            {copied === "copied" ? "Copied. Paste it to Harper" : "Copy week for Harper"}
          </button>
          {fallback && <textarea readOnly value={fallback} rows={9} aria-label="Summary for Harper" className="font-body mt-2 w-full rounded-lg bg-neutral-50 p-2 text-sm" />}
        </>
      )}
      <p className="font-body mt-2 text-xs text-neutral-400">Habits only. Harper keeps the numbers.</p>
    </div>
  );
}
