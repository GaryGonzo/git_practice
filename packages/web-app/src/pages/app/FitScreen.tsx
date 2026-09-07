import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import {
  getFitProfile,
  getFitNutritionPlan,
  getActiveFitBlock,
  getWorkoutsThisWeek,
  logWorkoutToday,
  getFitBodyLogHistory,
  logFitBodyWeight,
  todayISO,
  type FitProfile,
  type FitNutritionPlan,
  type FitBlock,
  type FitBodyLogEntry,
} from "../../lib/golfableApi";
import { HandicapTrendChart } from "../../components/HandicapTrendChart";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-t border-neutral-100 py-2.5 first:border-t-0 first:pt-0">
      <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</p>
      <p className="font-body mt-0.5 text-sm text-neutral-800">{value}</p>
    </div>
  );
}

function ConsultationCard({ profile }: { profile: FitProfile }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        Your Consultation
      </p>
      <div className="mt-1">
        <InfoRow label="Goal" value={profile.goals} />
        <InfoRow label="Current Fitness Level" value={profile.fitnessLevel} />
        <InfoRow label="Injuries" value={profile.injuries} />
        <InfoRow label="Swing Focus" value={profile.swingFocus} />
        <InfoRow label="Tight Areas" value={profile.tightAreas} />
        <InfoRow label="Exercise Preferences" value={profile.exercisePreferences} />
      </div>
    </div>
  );
}

function NutritionCard({ plan }: { plan: FitNutritionPlan }) {
  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">Nutrition</p>
      {plan.dailyCalories !== null && (
        <p className="font-display mt-1 text-3xl">
          {plan.dailyCalories}
          <span className="text-base font-normal text-neutral-500"> cal/day</span>
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {plan.proteinLevel && (
          <span className="font-label bg-brand/10 text-brand rounded-full px-2.5 py-1 text-xs font-semibold">
            {plan.proteinLevel} Protein
          </span>
        )}
        {plan.carbLevel && (
          <span className="font-label rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {plan.carbLevel.split(" -- ")[0]} Carb
          </span>
        )}
        {plan.fatLevel && (
          <span className="font-label rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {plan.fatLevel} Fat
          </span>
        )}
        {plan.produceLevel && (
          <span className="font-label rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {plan.produceLevel}
          </span>
        )}
      </div>
      {plan.mealsPerDay !== null && (
        <p className="font-body mt-2 text-sm text-neutral-600">{plan.mealsPerDay} meals per day.</p>
      )}
      {plan.carbLevel?.includes(" -- ") && (
        <p className="font-body mt-1 text-sm text-neutral-600">{plan.carbLevel.split(" -- ")[1]}.</p>
      )}
      {plan.rules.length > 0 && (
        <ul className="font-body mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
          {plan.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeightCard({ userId, goalWeightLossLbs }: { userId: string; goalWeightLossLbs: number | null }) {
  const [history, setHistory] = useState<FitBodyLogEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFitBodyLogHistory(userId).then(setHistory);
  }, [userId]);

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const first = history.length > 0 ? history[0] : null;
  const lost = first && latest ? first.weightLbs - latest.weightLbs : null;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter a valid weight.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await logFitBodyWeight(userId, num);
      setHistory(await getFitBodyLogHistory(userId));
      setEditing(false);
      setValue("");
    } catch {
      setError("Couldn't save that -- try again.");
    }
    setSaving(false);
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">Body Weight</p>
      {latest ? (
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-display mt-1 text-3xl">{latest.weightLbs} lbs</p>
          {lost !== null && lost !== 0 && (
            <span className={`font-label text-sm font-semibold ${lost > 0 ? "text-green-600" : "text-red-600"}`}>
              {lost > 0 ? `-${lost}` : `+${Math.abs(lost)}`} lbs since your first entry
            </span>
          )}
        </div>
      ) : (
        <p className="font-body mt-1 text-sm text-neutral-500">Not logged yet.</p>
      )}
      {goalWeightLossLbs !== null && (
        <p className="font-body mt-1 text-sm text-neutral-600">
          Goal: lose {goalWeightLossLbs} lbs{lost !== null ? ` -- ${Math.max(goalWeightLossLbs - lost, 0)} to go` : ""}.
        </p>
      )}
      {history.length > 2 && (
        <HandicapTrendChart
          points={history.map((h) => ({ value: h.weightLbs, recordedAt: h.recordedAt }))}
          label="Body weight trend over time"
        />
      )}

      {editing ? (
        <form onSubmit={handleSave} className="mt-3 space-y-2">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 198.4"
            className="font-body w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-label flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !value}
              className="font-label bg-brand flex-1 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-label text-brand mt-3 text-sm font-semibold underline"
        >
          Log your weight
        </button>
      )}
    </div>
  );
}

function BlockCard({ userId, block }: { userId: string; block: FitBlock }) {
  const [loggedDates, setLoggedDates] = useState<string[]>([]);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    getWorkoutsThisWeek(userId, block.id).then(setLoggedDates);
  }, [userId, block.id]);

  const doneToday = loggedDates.includes(todayISO());
  const atGoal = loggedDates.length >= block.sessionsPerWeek;

  async function handleLog() {
    setLogging(true);
    try {
      await logWorkoutToday(userId, block.id);
      setLoggedDates(await getWorkoutsThisWeek(userId, block.id));
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            Current Block
          </p>
          <p className="font-display text-2xl">{block.name}</p>
          <p className="font-body text-sm text-neutral-500">
            {block.weekCount} weeks &middot; {block.sessionsPerWeek}x per week
          </p>
        </div>
        {block.stepGoal !== null && (
          <div className="flex-none rounded-lg bg-neutral-50 px-3 py-2 text-center">
            <p className="font-display text-lg">{block.stepGoal.toLocaleString()}</p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Steps/day</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-50 p-3">
        <div>
          <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">This Week</p>
          <p className={`font-display text-xl ${atGoal ? "text-brand" : ""}`}>
            {loggedDates.length}/{block.sessionsPerWeek} sessions
          </p>
        </div>
        <button
          type="button"
          onClick={handleLog}
          disabled={logging || doneToday}
          className="font-label bg-brand rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {doneToday ? "Logged Today" : logging ? "Saving…" : "Log Today's Workout"}
        </button>
      </div>

      {block.careNotes && (
        <div className="border-gold/40 bg-gold/5 mt-3 rounded-lg border p-3">
          <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Care Notes</p>
          <p className="font-body mt-1 text-sm text-neutral-700">{block.careNotes}</p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {block.sections.map((section) => (
          <div key={section.id}>
            <div className="flex items-center gap-2">
              <p className="font-label text-sm font-semibold">{section.title}</p>
              {section.setCount !== null && (
                <span className="font-label bg-brand/10 text-brand rounded-full px-2 py-0.5 text-xs font-semibold">
                  {section.setCount} set{section.setCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="mt-1.5 space-y-1.5">
              {section.exercises.map((exercise) => (
                <div key={exercise.id} className="rounded-md bg-neutral-50 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-body text-sm font-semibold text-neutral-800">{exercise.name}</p>
                    {exercise.prescription && (
                      <p className="font-label flex-none text-xs font-semibold text-neutral-500">
                        {exercise.prescription}
                      </p>
                    )}
                  </div>
                  {exercise.cue && <p className="font-body mt-0.5 text-xs text-neutral-500">{exercise.cue}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FitScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [loading, setLoading] = useState(true);
  const [fitProfile, setFitProfile] = useState<FitProfile | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<FitNutritionPlan | null>(null);
  const [block, setBlock] = useState<FitBlock | null>(null);

  useEffect(() => {
    (async () => {
      const [p, n, b] = await Promise.all([
        getFitProfile(userId),
        getFitNutritionPlan(userId),
        getActiveFitBlock(userId),
      ]);
      setFitProfile(p);
      setNutritionPlan(n);
      setBlock(b);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">Golfable</p>
      <h1 className="font-display text-3xl tracking-wide">
        Golfable <span className="text-brand">Fit</span>
      </h1>
      <p className="font-body mt-1 text-sm text-neutral-500">Training built around your body and your swing.</p>

      <div className="mt-4">
        {fitProfile && <ConsultationCard profile={fitProfile} />}
        {nutritionPlan && <NutritionCard plan={nutritionPlan} />}
        <WeightCard userId={userId} goalWeightLossLbs={fitProfile?.goalWeightLossLbs ?? null} />
        {block ? (
          <BlockCard userId={userId} block={block} />
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-center">
            <p className="font-body text-sm text-neutral-500">No active training block yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
