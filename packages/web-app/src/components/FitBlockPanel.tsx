import { useEffect, useState } from "react";
import {
  fitBlockWeekNumber,
  getFitBlockGoals,
  setFitBlockGoalAchieved,
  getFitBenchmarks,
  saveFitBenchmark,
  type FitBlock,
  type FitBlockGoal,
  type FitBenchmarkResult,
} from "../lib/golfableApi";
import { FairwayPanel, Meter } from "./ui";
import { CelebrationToast } from "./CelebrationToast";

const PHASE_LABEL = { build: "Build week", deload: "Deload week", benchmark: "Benchmark week" } as const;

function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// Week / phase / number-to-beat / mini goals / benchmark log for blocks
// with a start_date (0067). Older blocks without one render nothing.
export function FitBlockPanel({ userId, block, date }: { userId: string; block: FitBlock; date: string }) {
  const [goals, setGoals] = useState<FitBlockGoal[]>([]);
  const [benchmarks, setBenchmarks] = useState<FitBenchmarkResult[]>([]);
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!block.startDate) return;
    Promise.all([getFitBlockGoals(block.id), getFitBenchmarks(userId)])
      .then(([g, b]) => {
        setGoals(g);
        setBenchmarks(b);
      })
      .catch(() => undefined);
  }, [userId, block.id, block.startDate]);

  const weekNumber = fitBlockWeekNumber(block, date);
  if (!block.startDate) return null;

  const week = block.weeks.find((w) => w.weekNumber === weekNumber) ?? null;
  const metric = block.targetExercise;
  // Latest result for this block's number-to-beat, else the last one ever.
  const latest = metric ? (benchmarks.find((b) => b.metric === metric && b.blockId === block.id) ?? null) : null;
  const toBeat = latest?.previousValue ?? (metric ? (benchmarks.find((b) => b.metric === metric && b.blockId !== block.id)?.value ?? null) : null);
  const retestWeek = week?.phase !== "build" || weekNumber === block.weekCount;

  async function handleGoal(goal: FitBlockGoal) {
    const achieved = !goal.achievedAt;
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, achievedAt: achieved ? new Date().toISOString() : null } : g)));
    await setFitBlockGoalAchieved(userId, goal, achieved);
    if (achieved) setToast(`Goal done: ${goal.title}`);
  }

  async function handleBenchmark() {
    const value = Number(entry);
    if (!metric || !Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    try {
      const result = await saveFitBenchmark(userId, block.id, { metric, value, unit: block.targetUnit });
      setBenchmarks(await getFitBenchmarks(userId));
      setEntry("");
      if (result?.beatLastTime) setToast(`Beat last time: ${value} vs ${result.previousValue}!`);
    } finally {
      setSaving(false);
    }
  }

  const goalsDone = goals.filter((g) => g.achievedAt).length;

  return (
    <FairwayPanel className="mt-4">
      <div className="p-5">
        <p className="font-label text-base font-medium text-white/60">
          {block.name}
          {block.goalLabel ? ` · ${block.goalLabel}` : ""}
        </p>
        {weekNumber === null ? (
          <h2 className="font-display mt-1 text-[2rem] leading-none tracking-wide">Starts {formatShortDate(block.startDate)}</h2>
        ) : (
          <>
            <h2 className="font-display mt-1 text-[2.2rem] leading-none tracking-wide">
              Week {weekNumber} <span className="text-white/50">of {block.weekCount}</span>
            </h2>
            {week && (
              <p className="font-label text-gold mt-1 text-base font-semibold">
                {PHASE_LABEL[week.phase]}
                {week.intensityPct ? ` · ${week.intensityPct}%` : ""}
              </p>
            )}
            {week?.notes && <p className="font-body mt-1 text-sm leading-relaxed text-white/70">{week.notes}</p>}
            <div className="mt-3">
              <Meter value={weekNumber} max={block.weekCount} tone="bg-gold" track="bg-white/10" />
            </div>
          </>
        )}

        {metric && (
          <div className="mt-4 rounded-xl bg-white/10 p-3">
            <p className="font-label text-sm font-semibold text-white/60">Number to beat</p>
            <p className="font-label text-lg font-semibold">
              {metric}
              {block.targetUnit ? <span className="text-white/60"> · {block.targetUnit}</span> : null}
            </p>
            <p className="font-display text-gold text-3xl leading-none">
              {toBeat ?? block.targetValue ?? "—"}
              {latest && (
                <span className={`font-label ml-2 text-base ${latest.beatLastTime ? "text-gold" : "text-white/60"}`}>
                  {latest.beatLastTime === null ? `First test: ${latest.value}` : latest.beatLastTime ? `Beat it: ${latest.value}` : `Got ${latest.value}`}
                </span>
              )}
            </p>
            {retestWeek && weekNumber !== null && (
              <div className="mt-2 flex gap-2">
                <input
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  inputMode="decimal"
                  placeholder="Today's result"
                  aria-label={`${metric} result`}
                  className="font-label min-w-0 flex-1 rounded-full bg-white px-4 py-2 text-base text-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleBenchmark}
                  disabled={saving || entry === ""}
                  className="font-label bg-gold text-brand-dark rounded-full px-4 py-2 text-base font-bold disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Log"}
                </button>
              </div>
            )}
          </div>
        )}

        {goals.length > 0 && (
          <div className="mt-4">
            <p className="font-label mb-1.5 flex justify-between text-sm font-semibold text-white/60">
              <span>Block goals</span>
              <span className="text-white">
                {goalsDone} of {goals.length}
              </span>
            </p>
            <ul className="space-y-1.5">
              {goals.map((goal) => (
                <li key={goal.id}>
                  <button type="button" onClick={() => handleGoal(goal)} className="flex w-full items-center gap-2 text-left">
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                        goal.achievedAt ? "bg-gold border-gold text-brand-dark" : "border-white/40"
                      }`}
                      aria-hidden="true"
                    >
                      {goal.achievedAt ? "✓" : ""}
                    </span>
                    <span className={`font-body text-sm ${goal.achievedAt ? "text-white/50 line-through" : "text-white"}`}>{goal.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {toast && <CelebrationToast message={toast} particles={["🏆", "⛳", "✨", "💪"]} onDone={() => setToast(null)} />}
    </FairwayPanel>
  );
}
