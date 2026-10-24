import { useEffect, useState } from "react";
import {
  fitBlockWeekNumber,
  getFitBlockGoals,
  setFitBlockGoalAchieved,
  setFitBlockGoalTarget,
  setFitBlockTarget,
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
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  // Local copy of the block's target so edits show without refetching the block.
  const [target, setTarget] = useState({ exercise: block.targetExercise, value: block.targetValue, unit: block.targetUnit });
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState({ exercise: "", value: "", unit: "" });
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalDrafts, setGoalDrafts] = useState<Record<string, string>>({});
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  useEffect(() => {
    setTarget({ exercise: block.targetExercise, value: block.targetValue, unit: block.targetUnit });
  }, [block.id, block.targetExercise, block.targetValue, block.targetUnit]);

  useEffect(() => {
    if (!block.startDate) return;
    setLoadState("loading");
    Promise.all([getFitBlockGoals(block.id), getFitBenchmarks(userId)])
      .then(([g, b]) => {
        setGoals(g);
        setBenchmarks(b);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [userId, block.id, block.startDate, reloadKey]);

  function openTargetEditor() {
    setTargetDraft({
      exercise: target.exercise ?? "",
      value: target.value === null ? "" : String(target.value),
      unit: target.unit ?? "lb",
    });
    setTargetError(null);
    setEditingTarget(true);
  }

  async function handleSaveTarget() {
    const exercise = targetDraft.exercise.trim();
    const value = targetDraft.value.trim() === "" ? null : Number(targetDraft.value);
    if (!exercise) return setTargetError("Add the lift you're testing.");
    if (value !== null && (!Number.isFinite(value) || value <= 0)) return setTargetError("Enter a number above 0.");
    const unit = targetDraft.unit.trim() || null;
    setTargetSaving(true);
    setTargetError(null);
    try {
      await setFitBlockTarget(userId, block.id, { value, exercise, unit });
      setTarget({ exercise, value, unit });
      setEditingTarget(false);
      if (value !== null) setToast(`Number to beat set: ${value}${unit ? ` ${unit}` : ""}`);
    } catch {
      setTargetError("Couldn't save. Check your connection and try again.");
    } finally {
      setTargetSaving(false);
    }
  }

  function openGoalEditor() {
    setGoalDrafts(Object.fromEntries(goals.map((g) => [g.id, g.target === null ? "" : String(g.target)])));
    setGoalsError(null);
    setEditingGoals(true);
  }

  async function handleSaveGoals() {
    const changes: { id: string; target: number | null }[] = [];
    for (const g of goals) {
      const raw = (goalDrafts[g.id] ?? "").trim();
      const next = raw === "" ? null : Number(raw);
      if (next !== null && (!Number.isFinite(next) || next < 0)) return setGoalsError(`Check the number for "${g.title}".`);
      if (next !== g.target) changes.push({ id: g.id, target: next });
    }
    setGoalsSaving(true);
    setGoalsError(null);
    try {
      await Promise.all(changes.map((c) => setFitBlockGoalTarget(c.id, c.target)));
      setGoals((prev) => prev.map((g) => {
        const c = changes.find((x) => x.id === g.id);
        return c ? { ...g, target: c.target } : g;
      }));
      setEditingGoals(false);
    } catch {
      setGoalsError("Couldn't save. Check your connection and try again.");
    } finally {
      setGoalsSaving(false);
    }
  }

  const weekNumber = fitBlockWeekNumber(block, date);
  if (!block.startDate) return null;

  const week = block.weeks.find((w) => w.weekNumber === weekNumber) ?? null;
  const metric = target.exercise;
  // Latest result for this block's number-to-beat, else the last one ever.
  const latest = metric ? (benchmarks.find((b) => b.metric === metric && b.blockId === block.id) ?? null) : null;
  const toBeat = latest?.previousValue ?? (metric ? (benchmarks.find((b) => b.metric === metric && b.blockId !== block.id)?.value ?? null) : null);
  const retestWeek = week?.phase !== "build" || weekNumber === block.weekCount;

  async function handleGoal(goal: FitBlockGoal) {
    const achieved = !goal.achievedAt;
    const flip = (on: boolean) =>
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, achievedAt: on ? new Date().toISOString() : null } : g)));
    flip(achieved);
    try {
      await setFitBlockGoalAchieved(userId, goal, achieved);
      if (achieved) setToast(`Goal done: ${goal.title}`);
    } catch {
      flip(!achieved);
      setGoalsError("Couldn't update that goal. Try again.");
    }
  }

  async function handleBenchmark() {
    const value = Number(entry);
    if (!metric || !Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    try {
      const result = await saveFitBenchmark(userId, block.id, { metric, value, unit: target.unit });
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

        {editingTarget ? (
          <div className="mt-4 rounded-xl bg-white/10 p-3">
            <p className="font-label text-sm font-semibold text-white/60">{target.value === null ? "Set your starting number" : "Edit number to beat"}</p>
            <label className="mt-2 block">
              <span className="font-label text-sm text-white/70">Lift</span>
              <input
                value={targetDraft.exercise}
                onChange={(e) => setTargetDraft((d) => ({ ...d, exercise: e.target.value }))}
                placeholder="e.g. Trap bar deadlift"
                className="font-label mt-1 h-12 w-full rounded-xl bg-white px-4 text-base text-neutral-900"
              />
            </label>
            <div className="mt-2 flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="font-label text-sm text-white/70">Number</span>
                <input
                  value={targetDraft.value}
                  onChange={(e) => setTargetDraft((d) => ({ ...d, value: e.target.value }))}
                  inputMode="decimal"
                  placeholder="Starting number"
                  className="font-label mt-1 h-12 w-full rounded-xl bg-white px-4 text-base text-neutral-900"
                />
              </label>
              <label className="w-24">
                <span className="font-label text-sm text-white/70">Unit</span>
                <input
                  value={targetDraft.unit}
                  onChange={(e) => setTargetDraft((d) => ({ ...d, unit: e.target.value }))}
                  placeholder="lb"
                  className="font-label mt-1 h-12 w-full rounded-xl bg-white px-4 text-base text-neutral-900"
                />
              </label>
            </div>
            {targetError && <p role="alert" className="font-body mt-2 text-sm text-red-300">{targetError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleSaveTarget}
                disabled={targetSaving}
                className="font-label bg-gold text-brand-dark min-h-12 flex-1 rounded-full px-4 text-base font-bold disabled:opacity-60"
              >
                {targetSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingTarget(false)}
                disabled={targetSaving}
                className="font-label min-h-12 rounded-full border border-white/30 px-5 text-base font-semibold text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : target.value === null && weekNumber !== null && !latest ? (
          <button
            type="button"
            onClick={openTargetEditor}
            className="border-gold/60 mt-4 flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-dashed bg-white/5 p-3 text-left"
          >
            <span>
              <span className="font-label text-gold block text-lg font-bold">Set your starting number</span>
              <span className="font-body block text-sm text-white/70">
                {metric ? `${metric}${target.unit ? ` · ${target.unit}` : ""}: ` : ""}the number this block is trying to beat.
              </span>
            </span>
            <span className="font-display text-gold text-3xl" aria-hidden="true">+</span>
          </button>
        ) : metric ? (
          <div className="mt-4 rounded-xl bg-white/10 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-label text-sm font-semibold text-white/60">Number to beat</p>
                <p className="font-label text-lg font-semibold">
                  {metric}
                  {target.unit ? <span className="text-white/60"> · {target.unit}</span> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={openTargetEditor}
                aria-label="Edit number to beat"
                className="font-label -mr-1 -mt-1 min-h-11 min-w-11 rounded-full px-3 text-sm font-semibold text-white/80 underline-offset-2 hover:underline"
              >
                Edit
              </button>
            </div>
            <p className="font-display text-gold text-4xl leading-none">
              {toBeat ?? target.value ?? "—"}
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
                  className="font-label h-12 min-w-0 flex-1 rounded-full bg-white px-4 text-base text-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleBenchmark}
                  disabled={saving || entry === ""}
                  className="font-label bg-gold text-brand-dark min-h-12 rounded-full px-5 text-base font-bold disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Log"}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {loadState === "loading" && (
          <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading block goals">
            <div className="h-4 w-1/3 animate-pulse rounded bg-white/15" />
            <div className="h-11 animate-pulse rounded-xl bg-white/10" />
            <div className="h-11 animate-pulse rounded-xl bg-white/10" />
          </div>
        )}
        {loadState === "error" && (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-white/10 p-3">
            <p className="font-body text-sm text-white/80">Couldn't load block goals.</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="font-label min-h-11 rounded-full border border-white/30 px-4 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {goals.length > 0 && (
          <div className="mt-4">
            <div className="font-label mb-1.5 flex items-center justify-between text-sm font-semibold text-white/60">
              <span>Block goals</span>
              <span className="flex items-center gap-1">
                <span className="text-white">
                  {goalsDone} of {goals.length}
                </span>
                {!editingGoals && (
                  <button
                    type="button"
                    onClick={openGoalEditor}
                    className="font-label min-h-11 rounded-full px-3 text-sm font-semibold text-white/80 hover:underline"
                  >
                    {goals.some((g) => g.metric !== "habit" && g.target === null) ? "Set targets" : "Edit"}
                  </button>
                )}
              </span>
            </div>
            {editingGoals ? (
              <div className="space-y-2">
                {goals.map((goal) => (
                  <label key={goal.id} className="flex items-center gap-2">
                    <span className="font-body min-w-0 flex-1 text-sm text-white">{goal.title}</span>
                    <input
                      value={goalDrafts[goal.id] ?? ""}
                      onChange={(e) => setGoalDrafts((d) => ({ ...d, [goal.id]: e.target.value }))}
                      inputMode="decimal"
                      placeholder="Target"
                      aria-label={`Target for ${goal.title}`}
                      className="font-label h-12 w-28 rounded-xl bg-white px-3 text-base text-neutral-900"
                    />
                  </label>
                ))}
                {goalsError && <p role="alert" className="font-body text-sm text-red-300">{goalsError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveGoals}
                    disabled={goalsSaving}
                    className="font-label bg-gold text-brand-dark min-h-12 flex-1 rounded-full px-4 text-base font-bold disabled:opacity-60"
                  >
                    {goalsSaving ? "Saving…" : "Save targets"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingGoals(false)}
                    disabled={goalsSaving}
                    className="font-label min-h-12 rounded-full border border-white/30 px-5 text-base font-semibold text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {goals.map((goal) => (
                  <li key={goal.id}>
                    <button type="button" onClick={() => handleGoal(goal)} className="flex min-h-11 w-full items-center gap-3 text-left">
                      <span
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 ${
                          goal.achievedAt ? "bg-gold border-gold text-brand-dark" : "border-white/40"
                        }`}
                        aria-hidden="true"
                      >
                        {goal.achievedAt ? "✓" : ""}
                      </span>
                      <span className={`font-body flex-1 text-sm ${goal.achievedAt ? "text-white/50 line-through" : "text-white"}`}>{goal.title}</span>
                      {goal.target !== null && <span className="font-label text-gold text-sm font-semibold">{goal.target}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {goalsError && !editingGoals && <p role="alert" className="font-body mt-1 text-sm text-red-300">{goalsError}</p>}
          </div>
        )}
      </div>
      {toast && <CelebrationToast message={toast} particles={["🏆", "⛳", "✨", "💪"]} onDone={() => setToast(null)} />}
    </FairwayPanel>
  );
}
