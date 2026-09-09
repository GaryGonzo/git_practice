import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getWorkoutSession,
  updateExerciseLog,
  finishWorkout,
  abandonWorkout,
  getDrillForDate,
  getMyScoreForDate,
  todayISO,
  type FitWorkoutSession,
  type FitWorkoutSectionView,
  type FitWorkoutExercise,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 19c3-6 6-9 11-11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Offered once a workout is finished -- a low-key nudge toward the day's
// practice, not a hard gate, so declining just moves on to Fit as usual.
function CooldownPrompt({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="bg-brand/10 text-brand mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <LeafIcon className="h-8 w-8" />
        </div>
        <h2 className="font-display mt-4 text-2xl tracking-wide">Nice work!</h2>
        <p className="font-body mt-2 text-sm text-neutral-600">Complete today's Golfable as a cooldown?</p>
        <button
          type="button"
          onClick={onConfirm}
          className="font-label bg-brand mt-6 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="font-label mt-2 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-neutral-500"
        >
          No Thanks
        </button>
      </div>
    </div>
  );
}

// Section flavor by keyword in its title -- deliberately loose matching so
// section titles a future block invents still land somewhere sensible
// (default to the "circuit" color) instead of falling back to plain gray.
type SectionFlavor = "recover" | "warmup" | "circuit" | "finisher";

function sectionFlavor(title: string): SectionFlavor {
  const t = title.toLowerCase();
  if (t.includes("warm")) return "warmup";
  if (t.includes("finish")) return "finisher";
  if (t.includes("roll") || t.includes("recover")) return "recover";
  return "circuit";
}

const FLAVOR_BORDER: Record<SectionFlavor, string> = {
  recover: "border-fit-recover",
  warmup: "border-fit-warmup",
  circuit: "border-fit-circuit",
  finisher: "border-fit-finisher",
};

const FLAVOR_BG: Record<SectionFlavor, string> = {
  recover: "bg-fit-recover",
  warmup: "bg-fit-warmup",
  circuit: "bg-fit-circuit",
  finisher: "bg-fit-finisher",
};

const FLAVOR_TEXT: Record<SectionFlavor, string> = {
  recover: "text-fit-recover",
  warmup: "text-fit-warmup",
  circuit: "text-fit-circuit",
  finisher: "text-fit-finisher",
};

const FLAVOR_SOFT_BG: Record<SectionFlavor, string> = {
  recover: "bg-fit-recover/10",
  warmup: "bg-fit-warmup/10",
  circuit: "bg-fit-circuit/10",
  finisher: "bg-fit-finisher/10",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// A real +/- stepper with an editable number box in the middle, not just a
// static display -- tapping the box lets you type a number directly, same
// as nudging it with the buttons.
function CountStepper({
  value,
  onChange,
  color,
  min = 0,
  max = 999,
}: {
  value: number;
  onChange: (value: number) => void;
  color: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`font-label flex h-8 w-8 flex-none items-center justify-center rounded-full border text-base font-semibold disabled:opacity-30 ${color}`}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.round(n))));
        }}
        className="font-display w-12 rounded-md border border-neutral-300 py-1 text-center text-lg"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`font-label flex h-8 w-8 flex-none items-center justify-center rounded-full border text-base font-semibold disabled:opacity-30 ${color}`}
      >
        +
      </button>
    </div>
  );
}

function ExerciseRow({
  exercise,
  flavor,
  readOnly,
  onToggle,
  onChangeCount,
}: {
  exercise: FitWorkoutExercise;
  flavor: SectionFlavor;
  readOnly: boolean;
  onToggle: () => void;
  onChangeCount: (value: number) => void;
}) {
  const displayCount = exercise.actualCount ?? exercise.targetCount ?? 0;
  const stepperColorClass = `${FLAVOR_TEXT[flavor]} border-current`;

  return (
    <div
      className={`rounded-lg border p-3 ${exercise.completed ? `${FLAVOR_BORDER[flavor]} ${FLAVOR_SOFT_BG[flavor]}` : "border-neutral-200 bg-white"}`}
    >
      <div className="flex items-center gap-3">
        {!readOnly && (
          <button
            type="button"
            onClick={onToggle}
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 ${
              exercise.completed ? `${FLAVOR_BG[flavor]} border-transparent text-white` : "border-neutral-300 text-transparent"
            }`}
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
        {readOnly && exercise.completed && (
          <div className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-white ${FLAVOR_BG[flavor]}`}>
            <CheckIcon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-neutral-800">{exercise.name}</p>
          {exercise.cue && <p className="font-body mt-0.5 text-xs text-neutral-500">{exercise.cue}</p>}
        </div>
        {exercise.targetCount !== null && (
          <div className="flex-none text-right">
            {readOnly ? (
              <p className="font-display text-lg">
                {displayCount} <span className="font-label text-xs font-normal text-neutral-500">{exercise.unit}</span>
              </p>
            ) : (
              <>
                <CountStepper value={displayCount} onChange={onChangeCount} color={stepperColorClass} />
                {exercise.unit && <p className="font-label mt-0.5 text-center text-xs text-neutral-500">{exercise.unit}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  readOnly,
  onToggle,
  onChangeCount,
}: {
  section: FitWorkoutSectionView;
  readOnly: boolean;
  onToggle: (exercise: FitWorkoutExercise) => void;
  onChangeCount: (exercise: FitWorkoutExercise, value: number) => void;
}) {
  const flavor = sectionFlavor(section.title);
  const totalExercises = section.sets.reduce((sum, s) => sum + s.exercises.length, 0);
  const completedExercises = section.sets.reduce((sum, s) => sum + s.exercises.filter((e) => e.completed).length, 0);

  return (
    <div className={`rounded-xl border-l-4 bg-white p-3.5 shadow-sm ${FLAVOR_BORDER[flavor]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-label text-base font-semibold">{section.title}</p>
        <span className={`font-label rounded-full px-2 py-0.5 text-xs font-semibold ${FLAVOR_SOFT_BG[flavor]} ${FLAVOR_TEXT[flavor]}`}>
          {completedExercises}/{totalExercises}
        </span>
      </div>
      <div className="mt-3 space-y-4">
        {section.sets.map((set) => (
          <div key={set.setNumber}>
            {section.setCount !== null && section.setCount > 1 && (
              <p className={`font-label mb-1.5 text-xs font-semibold tracking-wide uppercase ${FLAVOR_TEXT[flavor]}`}>
                Set {set.setNumber} of {section.setCount}
              </p>
            )}
            <div className="space-y-1.5">
              {set.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.logId}
                  exercise={exercise}
                  flavor={flavor}
                  readOnly={readOnly}
                  onToggle={() => onToggle(exercise)}
                  onChangeCount={(value) => onChangeCount(exercise, value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FitWorkoutScreen() {
  const { workoutLogId } = useParams();
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const userId = authSession!.user.id;
  const [session, setSession] = useState<FitWorkoutSession | null | undefined>(undefined);
  const [finishing, setFinishing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cooldownHref, setCooldownHref] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutLogId) return;
    getWorkoutSession(workoutLogId).then(setSession);
  }, [workoutLogId]);

  if (session === undefined) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (session === null) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">Couldn't find that workout.</p>
        <Link to="/app/fit" className="font-label text-brand mt-2 inline-block text-sm font-semibold underline">
          Back to Golfable Fit
        </Link>
      </div>
    );
  }

  const readOnly = session.status === "completed";
  const totalExercises = session.sections.reduce((sum, s) => sum + s.sets.reduce((n, set) => n + set.exercises.length, 0), 0);
  const completedExercises = session.sections.reduce(
    (sum, s) => sum + s.sets.reduce((n, set) => n + set.exercises.filter((e) => e.completed).length, 0),
    0
  );

  function updateLocalExercise(logId: string, patch: Partial<FitWorkoutExercise>) {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) => ({
              ...s,
              sets: s.sets.map((set) => ({
                ...set,
                exercises: set.exercises.map((e) => (e.logId === logId ? { ...e, ...patch } : e)),
              })),
            })),
          }
        : prev
    );
  }

  async function handleToggle(exercise: FitWorkoutExercise) {
    const completed = !exercise.completed;
    // Marking a set complete without ever touching the stepper should still
    // leave a concrete recorded count, not a blank -- default it to the
    // target the moment it's checked off.
    const actualCount = completed && exercise.actualCount === null ? (exercise.targetCount ?? 0) : exercise.actualCount;
    updateLocalExercise(exercise.logId, { completed, actualCount });
    await updateExerciseLog(exercise.logId, { completed, actualCount });
  }

  async function handleCountChange(exercise: FitWorkoutExercise, value: number) {
    updateLocalExercise(exercise.logId, { actualCount: value });
    await updateExerciseLog(exercise.logId, { actualCount: value });
  }

  async function handleFinish() {
    if (!workoutLogId) return;
    setFinishing(true);
    try {
      await finishWorkout(workoutLogId);

      const date = todayISO();
      const found = await getDrillForDate(date);
      if (found) {
        const existingScore = await getMyScoreForDate(userId, found.drill.id, date);
        if (existingScore !== null) {
          // Already played today's Golfable -- nothing to nudge toward.
          navigate("/app/fit");
          return;
        }
        setCooldownHref("/app/today");
      } else {
        // No Golfable scheduled today (e.g. a weekend) -- point at Choose
        // Your Own instead.
        setCooldownHref("/app/library");
      }
    } finally {
      setFinishing(false);
    }
  }

  function handleCooldownConfirm() {
    if (cooldownHref) navigate(cooldownHref);
  }

  function handleCooldownDismiss() {
    navigate("/app/fit");
  }

  async function handleCancel() {
    if (!workoutLogId) return;
    setCanceling(true);
    try {
      await abandonWorkout(workoutLogId);
      navigate("/app/fit");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-28">
      <Link to="/app/fit" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Golfable Fit
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide">{session.templateName}</h1>
          <p className="font-body text-sm text-neutral-500">
            {readOnly ? `Completed ${session.completedAt ? formatDateTime(session.completedAt) : ""}` : `Started ${formatDateTime(session.startedAt)}`}
          </p>
        </div>
        {!readOnly && (
          <span className="font-label bg-gold/15 text-gold flex-none rounded-full px-2.5 py-1 text-xs font-semibold">In Progress</span>
        )}
      </div>

      {!readOnly && (
        <p className="font-label mt-2 text-sm font-semibold text-neutral-600">
          {completedExercises}/{totalExercises} logged
        </p>
      )}

      <div className="mt-4 space-y-4">
        {session.sections.map((section) => (
          <SectionBlock key={section.id} section={section} readOnly={readOnly} onToggle={handleToggle} onChangeCount={handleCountChange} />
        ))}
      </div>

      {!readOnly && (
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={canceling || finishing}
            className="font-label rounded-md border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-600 disabled:opacity-60"
          >
            {canceling ? "Canceling…" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishing || canceling}
            className="font-label bg-brand flex-1 rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {finishing ? "Saving…" : "Finish Workout"}
          </button>
        </div>
      )}

      {cooldownHref && <CooldownPrompt onConfirm={handleCooldownConfirm} onDismiss={handleCooldownDismiss} />}
    </div>
  );
}
