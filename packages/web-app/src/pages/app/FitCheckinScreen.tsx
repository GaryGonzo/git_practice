import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getFitBodyLogHistory,
  getFitStepLogHistory,
  getFitDailyLogs,
  getActiveFitBlock,
  getFitNutritionPlan,
  getFitProfile,
  countCompletedWorkoutsBetween,
  getFitRoundSummaries,
  getFitWeeklyCheckins,
  saveFitWeeklyCheckin,
  adjustFitCalories,
  addDaysISO,
  mondayOfISO,
  todayISO,
  type FitRoundSummary,
  type FitWeeklyCheckin,
} from "../../lib/golfableApi";
import { PageHeader, FairwayPanel, ChevronLeft, ChevronRight } from "../../components/ui";

const PACIFIC_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" });

function formatShort(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const LEAKS = [
  { id: "Doubles", focus: "Course strategy: aim at the middle of greens and take your medicine after bad drives (Friday sim round)." },
  { id: "Penalties", focus: "Driver to a fairway-width target, and pick the safe side of every tee shot (Monday)." },
  { id: "Putting", focus: "Lag putting and 3-8 footers: the putting Golfable plus mat work (Wednesday)." },
  { id: "Up-and-downs", focus: "Wedges from 40-110 yds and chipping to set targets (Wednesday)." },
  { id: "Driving", focus: "Backswing rotation reps, then driver to a fairway-width target (Monday)." },
  { id: "Approach", focus: "Irons to set targets with Saturday's yardages (Monday)." },
];

// Reads the round for its most expensive habit, in the order strokes are
// usually lost on the way from 85 to 79.
function suggestLeak(round: FitRoundSummary | null): string | null {
  if (!round || round.holesPlayed === 0) return null;
  const scale = 18 / round.holesPlayed;
  if (round.penalties * scale >= 2) return "Penalties";
  if (round.doublesOrWorse * scale >= 4) return "Doubles";
  if (round.putts * scale >= 34) return "Putting";
  if (round.fairways.of > 0 && round.fairways.hit / round.fairways.of < 0.4) return "Driving";
  if (round.greens.of > 0 && round.greens.hit / round.greens.of < 0.25) return "Approach";
  return "Up-and-downs";
}

interface Suggestion {
  text: string;
  calorieDelta: number;
}

// The plan's adjustment rules: two flat weeks in a row (< 0.5 lb/week)
// means eat 150 less or walk more; losing faster than 2 lbs/week means eat
// 150 more. Anything else, change nothing.
function suggestAdjustment(thisAvg: number | null, lastAvg: number | null, prevAvg: number | null): Suggestion {
  if (thisAvg === null || lastAvg === null) {
    return { text: "Need a weigh-in in this week and last week to judge the trend. Weigh in at least 3 mornings.", calorieDelta: 0 };
  }
  const lossThisWeek = lastAvg - thisAvg;
  const lossLastWeek = prevAvg !== null ? prevAvg - lastAvg : null;
  if (lossThisWeek > 2) {
    return { text: `Down ${lossThisWeek.toFixed(1)} lbs this week, which is faster than 2 lbs/week. Add 150 calories.`, calorieDelta: 150 };
  }
  if (lossThisWeek < 0.5 && lossLastWeek !== null && lossLastWeek < 0.5) {
    return {
      text: `Two flat weeks in a row (${lossLastWeek.toFixed(1)} then ${lossThisWeek.toFixed(1)} lbs). Cut 150 calories from carbs, or add 1,500 steps a day.`,
      calorieDelta: -150,
    };
  }
  if (lossThisWeek < 0.5) {
    return { text: `Only ${lossThisWeek.toFixed(1)} lbs this week. One flat week is noise -- change nothing yet.`, calorieDelta: 0 };
  }
  return { text: `Down ${lossThisWeek.toFixed(1)} lbs this week. Right on track -- change nothing.`, calorieDelta: 0 };
}

function Stat({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean | null }) {
  return (
    <div className="bg-white p-3.5">
      <p className="font-label text-sm font-semibold text-neutral-500">{label}</p>
      <p className={`font-display mt-0.5 text-3xl leading-none ${good === true ? "text-brand" : good === false ? "text-fit-circuit" : ""}`}>
        {value}
      </p>
      {sub && <p className="font-body mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export function FitCheckinScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [weekStart, setWeekStart] = useState(mondayOfISO(todayISO()));
  const weekEnd = addDaysISO(weekStart, 6);
  const [loading, setLoading] = useState(true);

  const [weightAvg, setWeightAvg] = useState<number | null>(null);
  const [weighIns, setWeighIns] = useState(0);
  const [lastAvg, setLastAvg] = useState<number | null>(null);
  const [prevAvg, setPrevAvg] = useState<number | null>(null);
  const [workoutsDone, setWorkoutsDone] = useState(0);
  const [workoutsGoal, setWorkoutsGoal] = useState<number | null>(null);
  const [stepsAvg, setStepsAvg] = useState<number | null>(null);
  const [stepGoal, setStepGoal] = useState<number | null>(null);
  const [sleepAvg, setSleepAvg] = useState<number | null>(null);
  const [sleepGoal, setSleepGoal] = useState<number | null>(null);
  const [waterAvg, setWaterAvg] = useState<number | null>(null);
  const [waterGoal, setWaterGoal] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [round, setRound] = useState<FitRoundSummary | null>(null);
  const [history, setHistory] = useState<FitWeeklyCheckin[]>([]);

  const [stress, setStress] = useState<number | null>(null);
  const [leak, setLeak] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    setApplied(null);
    (async () => {
      const lastStart = addDaysISO(weekStart, -7);
      const prevStart = addDaysISO(weekStart, -14);
      const [bodyHistory, stepHistory, dailyLogs, block, nutrition, profile, done, rounds, checkins] = await Promise.all([
        getFitBodyLogHistory(userId),
        getFitStepLogHistory(userId),
        getFitDailyLogs(userId, weekStart, weekEnd),
        getActiveFitBlock(userId),
        getFitNutritionPlan(userId),
        getFitProfile(userId),
        countCompletedWorkoutsBetween(userId, weekStart, weekEnd),
        getFitRoundSummaries(userId, weekStart, weekEnd),
        getFitWeeklyCheckins(userId),
      ]);

      const weightsIn = (start: string) => {
        const end = addDaysISO(start, 6);
        return bodyHistory
          .filter((b) => {
            const day = PACIFIC_DAY.format(new Date(b.recordedAt));
            return day >= start && day <= end;
          })
          .map((b) => b.weightLbs);
      };
      const thisWeights = weightsIn(weekStart);
      setWeightAvg(average(thisWeights));
      setWeighIns(thisWeights.length);
      setLastAvg(average(weightsIn(lastStart)));
      setPrevAvg(average(weightsIn(prevStart)));

      setWorkoutsDone(done);
      setWorkoutsGoal(block?.sessionsPerWeek ?? null);
      setStepGoal(block?.stepGoal ?? null);
      const weekSteps = stepHistory.filter((s) => s.loggedDate >= weekStart && s.loggedDate <= weekEnd).map((s) => s.steps);
      const stepAvg = average(weekSteps);
      setStepsAvg(stepAvg === null ? null : Math.round(stepAvg));

      const sleepAverage = average(dailyLogs.filter((d) => d.sleepHours !== null).map((d) => d.sleepHours as number));
      setSleepAvg(sleepAverage === null ? null : Math.round(sleepAverage * 10) / 10);
      const waterAverage = average(dailyLogs.filter((d) => d.waterOz > 0).map((d) => d.waterOz));
      setWaterAvg(waterAverage === null ? null : Math.round(waterAverage));
      setSleepGoal(profile?.sleepGoalHours ?? null);
      setWaterGoal(nutrition?.waterGoalOz ?? null);
      setCalories(nutrition?.dailyCalories ?? null);

      const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
      setRound(latestRound);
      setHistory(checkins);

      const existing = checkins.find((c) => c.weekStart === weekStart);
      setStress(existing?.stress ?? null);
      setLeak(existing?.biggestLeak ?? suggestLeak(latestRound));
      setNotes(existing?.notes ?? "");
      if (existing?.adjustment) setApplied(existing.adjustment);
      setLoading(false);
    })();
  }, [userId, weekStart, weekEnd]);

  const suggestion = suggestAdjustment(weightAvg, lastAvg, prevAvg);
  const leakFocus = LEAKS.find((l) => l.id === leak)?.focus ?? null;
  const roundLeak = suggestLeak(round);
  const isCurrentWeek = weekStart === mondayOfISO(todayISO());

  async function handleApply() {
    if (suggestion.calorieDelta === 0 || calories === null) return;
    setApplying(true);
    setError(null);
    try {
      await adjustFitCalories(userId, suggestion.calorieDelta);
      const next = calories + suggestion.calorieDelta;
      setCalories(next);
      setApplied(`${suggestion.calorieDelta > 0 ? "+" : "−"}${Math.abs(suggestion.calorieDelta)} calories (now ${next.toLocaleString()}/day)`);
    } catch {
      setError("Couldn't update calories -- try again.");
    }
    setApplying(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveFitWeeklyCheckin(userId, {
        weekStart,
        weightAvg: weightAvg === null ? null : Math.round(weightAvg * 10) / 10,
        weighInCount: weighIns,
        workoutsDone,
        workoutsGoal,
        stepsAvg,
        sleepAvg,
        waterAvg,
        roundScore: round?.score ?? null,
        biggestLeak: leak,
        stress,
        adjustment: applied,
        notes: notes.trim() || null,
      });
      setHistory(await getFitWeeklyCheckins(userId));
      setSaved(true);
    } catch {
      setError("Couldn't save the check-in -- try again.");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <PageHeader kicker="Golfable Fit" title="Sunday check-in" sub="Look at the numbers, change one thing." />

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDaysISO(w, -7))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-black/[0.06]"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-label text-lg leading-tight font-semibold">
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </p>
          <p className="font-label text-sm font-medium text-neutral-500">{isCurrentWeek ? "This week" : "Past week"}</p>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDaysISO(w, 7))}
          disabled={isCurrentWeek}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-black/[0.06] disabled:opacity-30"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center font-body text-neutral-500">Loading…</div>
      ) : (
        <>
          <FairwayPanel className="mt-5">
          <div className="p-5">
            <p className="font-label text-base font-medium text-white/60">This week's one change</p>
            <p className="font-label mt-1 text-[1.6rem] leading-tight font-semibold">{suggestion.text}</p>
            {applied ? (
              <p className="font-label text-gold mt-3 text-base font-semibold">Applied: {applied}</p>
            ) : (
              suggestion.calorieDelta !== 0 &&
              calories !== null && (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="font-label bg-gold text-brand-dark mt-4 w-full rounded-full px-4 py-3 text-base font-bold disabled:opacity-60"
                >
                  {applying
                    ? "Updating…"
                    : `${suggestion.calorieDelta > 0 ? "Add" : "Cut"} 150 calories (to ${(calories + suggestion.calorieDelta).toLocaleString()}/day)`}
                </button>
              )
            )}
          </div>
          </FairwayPanel>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.06]">
            <Stat
              label="Weight avg"
              value={weightAvg !== null ? `${weightAvg.toFixed(1)}` : "—"}
              sub={
                weightAvg !== null && lastAvg !== null
                  ? `${weighIns} weigh-ins · ${lastAvg - weightAvg >= 0 ? "−" : "+"}${Math.abs(lastAvg - weightAvg).toFixed(1)} vs last week`
                  : `${weighIns} weigh-in${weighIns === 1 ? "" : "s"} (aim for 3+)`
              }
              good={weighIns >= 3 ? null : false}
            />
            <Stat
              label="Workouts"
              value={`${workoutsDone}${workoutsGoal ? `/${workoutsGoal}` : ""}`}
              good={workoutsGoal ? workoutsDone >= workoutsGoal : null}
            />
            <Stat
              label="Steps avg"
              value={stepsAvg !== null ? stepsAvg.toLocaleString() : "—"}
              sub={stepGoal ? `Goal ${stepGoal.toLocaleString()}` : undefined}
              good={stepsAvg !== null && stepGoal ? stepsAvg >= stepGoal : null}
            />
            <Stat
              label="Sleep avg"
              value={sleepAvg !== null ? `${sleepAvg} hrs` : "—"}
              sub={sleepGoal ? `Goal ${sleepGoal} hrs` : undefined}
              good={sleepAvg !== null && sleepGoal ? sleepAvg >= sleepGoal - 0.25 : null}
            />
            <Stat
              label="Water avg"
              value={waterAvg !== null ? `${waterAvg} oz` : "—"}
              sub={waterGoal ? `Goal ${waterGoal} oz` : undefined}
              good={waterAvg !== null && waterGoal ? waterAvg >= waterGoal * 0.9 : null}
            />
            <Stat label="Calories" value={calories !== null ? calories.toLocaleString() : "—"} sub="Daily target" />
          </div>

          <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
            <p className="font-label text-lg font-semibold text-neutral-900">Saturday's round</p>
            {round ? (
              <>
                <p className="font-display mt-1 text-3xl">
                  {round.score}
                  <span className="text-base font-normal text-neutral-500">
                    {" "}
                    ({round.overPar >= 0 ? "+" : ""}
                    {round.overPar}) · {round.holesPlayed} holes
                  </span>
                </p>
                <div className="font-body mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-700">
                  <p>
                    Fairways: {round.fairways.hit}/{round.fairways.of}
                  </p>
                  <p>
                    Greens: {round.greens.hit}/{round.greens.of}
                  </p>
                  <p>Putts: {round.putts}</p>
                  <p>Penalties: {round.penalties}</p>
                  <p>Doubles or worse: {round.doublesOrWorse}</p>
                </div>
                {roundLeak && (
                  <p className="font-body mt-2 text-sm text-neutral-600">
                    The round points at <span className="font-semibold">{roundLeak.toLowerCase()}</span>.
                  </p>
                )}
              </>
            ) : (
              <p className="font-body mt-1 text-sm text-neutral-500">
                No round tracked this week. Use the round tracker on Saturday so this fills in.
              </p>
            )}
          </div>

          <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
            <p className="font-label text-lg font-semibold text-neutral-900">Biggest leak</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LEAKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLeak(l.id)}
                  className={`font-label rounded-full px-3 py-1.5 text-sm font-semibold ${
                    leak === l.id ? "bg-gold text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {l.id}
                </button>
              ))}
            </div>
            {leakFocus && (
              <p className="font-body mt-2 text-sm text-neutral-700">
                <span className="font-semibold">Next week's practice focus:</span> {leakFocus}
              </p>
            )}
          </div>

          <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
            <p className="font-label text-lg font-semibold text-neutral-900">Stress this week</p>
            <div className="mt-2 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStress(n)}
                  className={`font-label rounded-md py-1.5 text-sm font-semibold ${
                    stress === n ? (n >= 8 ? "bg-fit-circuit text-white" : "bg-brand text-white") : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {stress !== null && stress >= 8 && (
              <p className="font-body mt-2 text-sm text-neutral-700">
                High week. Protect the 3:00 shutdown and the evening walk, and use the bad-day rule: warm-up and main lift only.
              </p>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else? Knee or wrist sore, schedule changes…"
              rows={3}
              className="font-body focus:border-brand mt-3 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none"
            />
          </div>

          {error && <p className="font-body mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="font-label bg-brand mt-5 w-full rounded-full px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save check-in"}
          </button>

          {history.filter((h) => h.weekStart !== weekStart).length > 0 && (
            <div className="mt-6">
              <p className="font-label px-1 text-xl font-semibold text-neutral-900">Past check-ins</p>
              <div className="mt-2 space-y-2">
                {history
                  .filter((h) => h.weekStart !== weekStart)
                  .slice(0, 6)
                  .map((h) => (
                    <button
                      key={h.weekStart}
                      type="button"
                      onClick={() => setWeekStart(h.weekStart)}
                      className="flex w-full items-center justify-between rounded-2xl bg-white p-3.5 text-left ring-1 ring-black/[0.06]"
                    >
                      <span className="font-label text-sm font-semibold">Week of {formatShort(h.weekStart)}</span>
                      <span className="font-body text-sm text-neutral-600">
                        {h.weightAvg !== null ? `${h.weightAvg} lbs` : "—"} · {h.workoutsDone}
                        {h.workoutsGoal ? `/${h.workoutsGoal}` : ""} lifts
                        {h.roundScore !== null ? ` · shot ${h.roundScore}` : ""}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
