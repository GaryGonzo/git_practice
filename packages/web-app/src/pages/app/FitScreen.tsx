import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getFitProfile,
  getFitNutritionPlan,
  getActiveFitBlock,
  getWorkoutInstancesThisWeek,
  startWorkout,
  getFitBodyLogHistory,
  logFitBodyWeight,
  type FitProfile,
  type FitNutritionPlan,
  type FitBlock,
  type FitBodyLogEntry,
  type FitWorkoutInstance,
} from "../../lib/golfableApi";
import { HandicapTrendChart } from "../../components/HandicapTrendChart";

function ChevronDownIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`${className} transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Every top-level Fit card starts collapsed -- this is a lot of personal
// detail to load onto one screen at once, so nothing shows until asked for.
function CollapsibleCard({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">{title}</p>
          {!open && summary && <div className="mt-1">{summary}</div>}
        </div>
        <ChevronDownIcon open={open} className="h-5 w-5 flex-none text-neutral-400" />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

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
    <CollapsibleCard title="Your Consultation" summary={<p className="font-body text-sm text-neutral-600">{profile.goals}</p>}>
      <InfoRow label="Goal" value={profile.goals} />
      <InfoRow label="Current Fitness Level" value={profile.fitnessLevel} />
      <InfoRow label="Injuries" value={profile.injuries} />
      <InfoRow label="Swing Focus" value={profile.swingFocus} />
      <InfoRow label="Tight Areas" value={profile.tightAreas} />
      <InfoRow label="Exercise Preferences" value={profile.exercisePreferences} />
    </CollapsibleCard>
  );
}

function NutritionCard({ plan }: { plan: FitNutritionPlan }) {
  return (
    <CollapsibleCard
      title="Nutrition"
      summary={
        plan.dailyCalories !== null && (
          <p className="font-display text-2xl">
            {plan.dailyCalories}
            <span className="text-sm font-normal text-neutral-500"> cal/day</span>
          </p>
        )
      }
    >
      {plan.dailyCalories !== null && (
        <p className="font-display text-3xl">
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
      {plan.mealsPerDay !== null && <p className="font-body mt-2 text-sm text-neutral-600">{plan.mealsPerDay} meals per day.</p>}
      {plan.carbLevel?.includes(" -- ") && <p className="font-body mt-1 text-sm text-neutral-600">{plan.carbLevel.split(" -- ")[1]}.</p>}
      {plan.rules.length > 0 && (
        <ul className="font-body mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
          {plan.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      )}
    </CollapsibleCard>
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
    <CollapsibleCard
      title="Body Weight"
      summary={latest && <p className="font-display text-2xl">{latest.weightLbs} lbs</p>}
    >
      {latest ? (
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-display text-3xl">{latest.weightLbs} lbs</p>
          {lost !== null && lost !== 0 && (
            <span className={`font-label text-sm font-semibold ${lost > 0 ? "text-green-600" : "text-red-600"}`}>
              {lost > 0 ? `-${lost}` : `+${Math.abs(lost)}`} lbs since your first entry
            </span>
          )}
        </div>
      ) : (
        <p className="font-body text-sm text-neutral-500">Not logged yet.</p>
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
        <button type="button" onClick={() => setEditing(true)} className="font-label text-brand mt-3 text-sm font-semibold underline">
          Log your weight
        </button>
      )}
    </CollapsibleCard>
  );
}

// One slot in the week -- "Workout 2", subtitled with whichever session
// template fills it. Not started yet has no instance at all; tapping it
// starts one. In progress resumes it. Completed opens a read-only recap.
function WorkoutSlot({
  slotNumber,
  templateName,
  instance,
  starting,
  onStart,
  onOpen,
}: {
  slotNumber: number;
  templateName: string;
  instance: FitWorkoutInstance | undefined;
  starting: boolean;
  onStart: () => void;
  onOpen: (instanceId: string) => void;
}) {
  const status = instance?.status ?? "not_started";
  const statusLabel = status === "completed" ? "Completed" : status === "in_progress" ? "In Progress" : "Not Started";
  const statusClass =
    status === "completed"
      ? "bg-brand/10 text-brand"
      : status === "in_progress"
        ? "bg-gold/15 text-gold"
        : "bg-neutral-100 text-neutral-500";

  return (
    <button
      type="button"
      disabled={starting}
      onClick={() => (instance ? onOpen(instance.id) : onStart())}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 text-left active:bg-neutral-50 disabled:opacity-60"
    >
      <div className="min-w-0">
        <p className="font-label text-base font-semibold">Workout {slotNumber}</p>
        <p className="font-body text-sm text-neutral-500">{templateName}</p>
      </div>
      <span className={`font-label flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
        {starting ? "Starting…" : statusLabel}
      </span>
    </button>
  );
}

function BlockCard({ userId, block }: { userId: string; block: FitBlock }) {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<FitWorkoutInstance[]>([]);
  const [startingSlot, setStartingSlot] = useState<number | null>(null);

  useEffect(() => {
    getWorkoutInstancesThisWeek(userId, block.id).then(setInstances);
  }, [userId, block.id]);

  const completedCount = instances.filter((i) => i.status === "completed").length;
  const atGoal = completedCount >= block.sessionsPerWeek;

  async function handleStart(slotNumber: number, templateId: string) {
    setStartingSlot(slotNumber);
    try {
      const id = await startWorkout(userId, block.id, templateId);
      navigate(`/app/fit/workout/${id}`);
    } finally {
      setStartingSlot(null);
    }
  }

  const slots = Array.from({ length: block.sessionsPerWeek }, (_, i) => {
    const template = block.templates.length > 0 ? block.templates[i % block.templates.length] : null;
    return { slotNumber: i + 1, template, instance: instances[i] };
  });

  return (
    <CollapsibleCard
      title="Current Block"
      summary={
        <p className="font-body text-sm text-neutral-600">
          {block.name} &middot; {completedCount}/{block.sessionsPerWeek} sessions this week
        </p>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
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

      {block.careNotes && (
        <div className="border-gold/40 bg-gold/5 mt-3 rounded-lg border p-3">
          <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Care Notes</p>
          <p className="font-body mt-1 text-sm text-neutral-700">{block.careNotes}</p>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">This Week</p>
          <p className={`font-label text-sm font-semibold ${atGoal ? "text-brand" : "text-neutral-500"}`}>
            {completedCount}/{block.sessionsPerWeek}
          </p>
        </div>
        <div className="mt-2 space-y-2">
          {slots.map(({ slotNumber, template, instance }) =>
            template ? (
              <WorkoutSlot
                key={slotNumber}
                slotNumber={slotNumber}
                templateName={template.name}
                instance={instance}
                starting={startingSlot === slotNumber}
                onStart={() => handleStart(slotNumber, template.id)}
                onOpen={(id) => navigate(`/app/fit/workout/${id}`)}
              />
            ) : null
          )}
        </div>
      </div>
    </CollapsibleCard>
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
      const [p, n, b] = await Promise.all([getFitProfile(userId), getFitNutritionPlan(userId), getActiveFitBlock(userId)]);
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
