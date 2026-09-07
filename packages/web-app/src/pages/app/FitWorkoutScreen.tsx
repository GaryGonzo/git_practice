import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getWorkoutSession,
  updateExerciseLog,
  finishWorkout,
  abandonWorkout,
  type FitWorkoutSession,
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function ExerciseRow({
  exercise,
  readOnly,
  onToggle,
  onChangeActual,
}: {
  exercise: FitWorkoutExercise;
  readOnly: boolean;
  onToggle: () => void;
  onChangeActual: (value: string) => void;
}) {
  const displayValue = exercise.actualPrescription ?? exercise.defaultPrescription ?? "";

  return (
    <div className={`rounded-lg border p-3 ${exercise.completed ? "border-brand/30 bg-brand/5" : "border-neutral-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        {!readOnly && (
          <button
            type="button"
            onClick={onToggle}
            className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${
              exercise.completed ? "bg-brand border-brand text-white" : "border-neutral-300 text-transparent"
            }`}
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {readOnly && exercise.completed && (
          <div className="bg-brand mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-white">
            <CheckIcon className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-neutral-800">{exercise.name}</p>
          {exercise.cue && <p className="font-body mt-0.5 text-xs text-neutral-500">{exercise.cue}</p>}
          {readOnly ? (
            <p className="font-label mt-1.5 text-xs font-semibold text-neutral-600">{displayValue || "--"}</p>
          ) : (
            <input
              type="text"
              value={displayValue}
              onChange={(e) => onChangeActual(e.target.value)}
              placeholder={exercise.defaultPrescription ?? ""}
              className="font-body mt-1.5 w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function FitWorkoutScreen() {
  const { workoutLogId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<FitWorkoutSession | null | undefined>(undefined);
  const [finishing, setFinishing] = useState(false);
  const [canceling, setCanceling] = useState(false);

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
  const totalExercises = session.sections.reduce((sum, s) => sum + s.exercises.length, 0);
  const completedExercises = session.sections.reduce((sum, s) => sum + s.exercises.filter((e) => e.completed).length, 0);

  function updateLocalExercise(logId: string, patch: Partial<FitWorkoutExercise>) {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) => ({
              ...s,
              exercises: s.exercises.map((e) => (e.logId === logId ? { ...e, ...patch } : e)),
            })),
          }
        : prev
    );
  }

  async function handleToggle(exercise: FitWorkoutExercise) {
    const completed = !exercise.completed;
    updateLocalExercise(exercise.logId, { completed });
    await updateExerciseLog(exercise.logId, { completed });
  }

  async function handleActualChange(exercise: FitWorkoutExercise, value: string) {
    updateLocalExercise(exercise.logId, { actualPrescription: value });
    await updateExerciseLog(exercise.logId, { actualPrescription: value === "" ? null : value });
  }

  async function handleFinish() {
    if (!workoutLogId) return;
    setFinishing(true);
    try {
      await finishWorkout(workoutLogId);
      navigate("/app/fit");
    } finally {
      setFinishing(false);
    }
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
          {completedExercises}/{totalExercises} exercises logged
        </p>
      )}

      <div className="mt-4 space-y-5">
        {session.sections.map((section) => (
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
                <ExerciseRow
                  key={exercise.logId}
                  exercise={exercise}
                  readOnly={readOnly}
                  onToggle={() => handleToggle(exercise)}
                  onChangeActual={(value) => handleActualChange(exercise, value)}
                />
              ))}
            </div>
          </div>
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
    </div>
  );
}
