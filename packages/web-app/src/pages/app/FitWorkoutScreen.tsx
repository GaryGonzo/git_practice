import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getWorkoutSession,
  updateExerciseLog,
  finishWorkout,
  abandonWorkout,
  chooseExerciseOption,
  getDrillForDate,
  getMyScoreForDate,
  getPreviousExerciseResults,
  getFitStreaks,
  countSessionsDoneBetween,
  getActiveFitBlock,
  mondayOfISO,
  todayISO,
  type FitBadge,
  type FitWorkoutSession,
  type FitWorkoutSectionView,
  type FitWorkoutExercise,
  type FitPreviousResults,
  type FitExerciseOption,
} from "../../lib/golfableApi";
import { ChevronLeft, Meter } from "../../components/ui";
import { CelebrationToast } from "../../components/CelebrationToast";
import { ScreenSkeleton } from "../../components/FitPanelStates";

const BEEP_KEY = "golfable.fit.restBeep";

// Short two-tone beep via WebAudio -- no asset to load, silent if blocked.
function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.25].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i === 0 ? 880 : 1175;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => ctx.close().catch(() => undefined), 800);
  } catch {
    // audio not available; vibration + the green bar still signal "go"
  }
}

// Keep the phone awake while a workout is open. Re-acquires when the tab
// comes back (the browser drops the lock when hidden); no-op where the
// Screen Wake Lock API isn't supported.
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) next.release().catch(() => undefined);
        else lock = next;
      } catch {
        // denied (low battery, etc.) -- the workout still works
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
}

interface FinishSummary {
  setsDone: number;
  setsTotal: number;
  minutes: number;
  prs: FitBadge[];
  streak: number | null;
  weekDone: number | null;
  weekGoal: number | null;
  next: string;
}

function FinishSummarySheet({ summary, onContinue }: { summary: FinishSummary; onContinue: () => void }) {
  return (
    <Modal>
      <p className="text-4xl" aria-hidden="true">🏗️</p>
      <h2 className="font-display mt-1 text-[2.2rem] leading-none tracking-wide">Brick laid.</h2>
      <p className="font-body mt-1 text-sm text-neutral-500">Another phase of the build in the books.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-display text-brand text-3xl leading-none">{summary.setsDone}</p>
          <p className="font-label text-xs font-semibold text-neutral-500">of {summary.setsTotal} sets</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-display text-brand text-3xl leading-none">{summary.streak ?? "—"}</p>
          <p className="font-label text-xs font-semibold text-neutral-500">session streak</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-display text-brand text-3xl leading-none">
            {summary.weekDone ?? "—"}
            {summary.weekGoal ? <span className="text-lg text-neutral-400">/{summary.weekGoal}</span> : null}
          </p>
          <p className="font-label text-xs font-semibold text-neutral-500">this week</p>
        </div>
      </div>
      {summary.prs.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-2xl bg-amber-50 p-3 text-left">
          {summary.prs.map((pr) => (
            <li key={pr.id ?? pr.label} className="font-label text-sm font-semibold text-amber-900">
              🏆 New PR: {pr.label}
              {pr.value ? ` at ${pr.value} lbs` : ""}
            </li>
          ))}
        </ul>
      )}
      <p className="font-label mt-3 text-sm font-semibold text-neutral-500">{summary.minutes} min · streak +1</p>
      <button type="button" onClick={onContinue} className="font-label bg-brand mt-4 min-h-12 w-full rounded-full text-base font-bold text-white">
        Continue
      </button>
    </Modal>
  );
}

function ChevronDownIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${className} transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 19c3-6 6-9 11-11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/60 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">{children}</div>
    </div>
  );
}

// Offered once a workout is finished -- a nudge toward the day's practice,
// not a gate.
function CooldownPrompt({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  return (
    <Modal>
      <div className="bg-brand/10 text-brand mx-auto flex h-16 w-16 items-center justify-center rounded-full">
        <LeafIcon className="h-8 w-8" />
      </div>
      <h2 className="font-display mt-4 text-3xl tracking-wide">Workout logged</h2>
      <p className="font-body mt-1 text-sm text-neutral-600">Play today's Golfable as your cooldown?</p>
      <button type="button" onClick={onConfirm} className="font-label bg-brand mt-6 w-full rounded-full px-4 py-3.5 text-base font-bold text-white">
        Play today's Golfable
      </button>
      <button type="button" onClick={onDismiss} className="font-label mt-2 w-full rounded-full px-4 py-3 text-base font-semibold text-neutral-500">
        Not today
      </button>
    </Modal>
  );
}

function DiscardPrompt({ busy, onConfirm, onCancel }: { busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal>
      <h2 className="font-display text-3xl tracking-wide">Discard this workout?</h2>
      <p className="font-body mt-1 text-sm text-neutral-600">Everything you've logged in this session is deleted. This can't be undone.</p>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="font-label mt-6 w-full rounded-full bg-red-600 px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
      >
        {busy ? "Discarding…" : "Discard workout"}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className="font-label mt-2 w-full rounded-full px-4 py-3 text-base font-semibold text-neutral-600">
        Keep going
      </button>
    </Modal>
  );
}

// Section flavor by keyword in its title -- loose on purpose so titles a
// future block invents still land somewhere sensible.
type SectionFlavor = "recover" | "warmup" | "circuit" | "main";

function sectionFlavor(title: string): SectionFlavor {
  const t = title.toLowerCase();
  if (t.includes("main")) return "main";
  if (t.includes("warm") || t.includes("activation")) return "warmup";
  if (t.includes("roll") || t.includes("recover") || t.includes("stretch")) return "recover";
  return "circuit";
}

const FLAVOR_BAR: Record<SectionFlavor, string> = {
  recover: "bg-fit-recover",
  warmup: "bg-fit-warmup",
  circuit: "bg-fit-circuit",
  main: "bg-brand",
};

const FLAVOR_TEXT: Record<SectionFlavor, string> = {
  recover: "text-fit-recover",
  warmup: "text-fit-warmup",
  circuit: "text-fit-circuit",
  main: "text-brand",
};

// Rest between sets, by section. Warm-ups and stretches flow straight on.
const REST_SECONDS: Partial<Record<SectionFlavor, number>> = { main: 120, circuit: 60 };

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// A big, thumb-sized stepper: − / value / +. The value is a real input so
// it can also be typed.
function BigStepper({
  value,
  placeholder,
  onChange,
  step,
  unit,
  label,
}: {
  value: number | null;
  placeholder: string;
  onChange: (value: number) => void;
  step: number;
  unit: string;
  label: string;
}) {
  const current = value ?? 0;
  // While typing, keep the raw text so the box can be cleared and retyped.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-stretch overflow-hidden rounded-xl bg-neutral-100">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, current - step))}
          disabled={current <= 0}
          aria-label={`Less ${label}`}
          className="font-label w-11 flex-none text-2xl font-bold text-neutral-600 active:bg-neutral-200 disabled:opacity-30"
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={draft ?? (value ?? "")}
          placeholder={placeholder}
          aria-label={label}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value !== "" && Number.isFinite(n)) onChange(Math.max(0, n));
          }}
          onBlur={() => setDraft(null)}
          className="font-display w-full min-w-0 bg-transparent py-2 text-center text-[1.7rem] leading-none outline-none placeholder:text-neutral-300"
        />
        <button
          type="button"
          onClick={() => onChange(current + step)}
          aria-label={`More ${label}`}
          className="font-label w-11 flex-none text-2xl font-bold text-neutral-600 active:bg-neutral-200"
        >
          +
        </button>
      </div>
      <p className="font-label mt-1 text-center text-xs font-semibold text-neutral-400">{unit}</p>
    </div>
  );
}

function SetRow({
  exercise,
  flavor,
  previous,
  showName,
  multiSet,
  readOnly,
  onToggle,
  onChangeCount,
  onChangeWeight,
}: {
  exercise: FitWorkoutExercise;
  flavor: SectionFlavor;
  previous: { weightLbs: number | null; count: number | null } | undefined;
  showName: boolean;
  multiSet: boolean;
  readOnly: boolean;
  onToggle: () => void;
  onChangeCount: (value: number) => void;
  onChangeWeight: (value: number) => void;
}) {
  const canRepeat =
    !readOnly &&
    !exercise.completed &&
    !!previous &&
    ((exercise.tracksWeight && !!previous.weightLbs && previous.weightLbs !== exercise.actualWeightLbs) ||
      (exercise.targetCount !== null && previous.count !== null && previous.count !== exercise.actualCount));
  const [showCue, setShowCue] = useState(false);
  const hasCount = exercise.targetCount !== null;
  const prevText = previous
    ? [previous.weightLbs ? `${previous.weightLbs} lbs` : null, previous.count !== null ? `${previous.count}` : null].filter(Boolean).join(" × ")
    : null;
  const target = [exercise.targetWeightLbs ? `${exercise.targetWeightLbs} lbs` : null, hasCount ? `${exercise.targetCount} ${exercise.unit ?? ""}`.trim() : null]
    .filter(Boolean)
    .join(" × ");

  return (
    <div className={`px-4 py-3 ${exercise.completed ? "bg-neutral-50" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {showName && (
            <button type="button" onClick={() => setShowCue((s) => !s)} className="block text-left">
              <span className={`font-label block text-[1.1rem] leading-tight font-semibold ${exercise.completed ? "text-neutral-400" : "text-neutral-900"}`}>
                {exercise.name}
              </span>
            </button>
          )}
          {(target || prevText || (!showName && multiSet)) && (
            <p className="font-label text-sm font-semibold text-neutral-500">
              {!showName && multiSet && <span className={FLAVOR_TEXT[flavor]}>Set {exercise.setNumber}{target || prevText ? " · " : ""}</span>}
              {target && `Target ${target}`}
              {prevText && <span className="text-neutral-500">{target ? " · " : ""}Last: {prevText}</span>}
            </p>
          )}
          {!showName && !multiSet && !target && !prevText && (
            <p className="font-label text-base font-semibold text-neutral-600">{exercise.completed ? "Done" : "Tap the circle when you're done"}</p>
          )}
          {canRepeat && (
            <button
              type="button"
              onClick={() => {
                if (exercise.tracksWeight && previous?.weightLbs) onChangeWeight(previous.weightLbs);
                if (exercise.targetCount !== null && previous?.count != null) onChangeCount(previous.count);
              }}
              className="font-label text-brand -ml-2 min-h-11 rounded-full px-2 text-sm font-bold"
            >
              ↺ Same as last time
            </button>
          )}
          {showName && showCue && exercise.cue && <p className="font-body mt-1 text-sm leading-relaxed text-neutral-600">{exercise.cue}</p>}
        </div>
        {readOnly ? (
          exercise.completed && (
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-white ${FLAVOR_BAR[flavor]}`}>
              <CheckIcon className="h-5 w-5" />
            </span>
          )
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-label={exercise.completed ? `Mark ${exercise.name} set ${exercise.setNumber} not done` : `Mark ${exercise.name} set ${exercise.setNumber} done`}
            className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 transition-colors ${
              exercise.completed ? `${FLAVOR_BAR[flavor]} border-transparent text-white` : "border-neutral-300 text-neutral-300"
            }`}
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {(exercise.tracksWeight || hasCount) &&
        (readOnly ? (
          <p className="font-display mt-1 text-2xl leading-none text-neutral-800">
            {exercise.tracksWeight && <>{exercise.actualWeightLbs ?? "—"} <span className="font-label text-sm text-neutral-400">lbs</span></>}
            {exercise.tracksWeight && hasCount && <span className="text-neutral-300"> × </span>}
            {hasCount && <>{exercise.actualCount ?? "—"} <span className="font-label text-sm text-neutral-400">{exercise.unit}</span></>}
          </p>
        ) : (
          !exercise.completed && (
            <div className="mt-2.5 flex gap-2.5">
              {exercise.tracksWeight && (
                <BigStepper
                  label="weight"
                  value={exercise.actualWeightLbs}
                  placeholder={previous?.weightLbs ? String(previous.weightLbs) : "lbs"}
                  onChange={onChangeWeight}
                  step={5}
                  unit="lbs"
                />
              )}
              {hasCount && (
                <BigStepper
                  label={exercise.unit ?? "reps"}
                  value={exercise.actualCount ?? exercise.targetCount}
                  placeholder={String(exercise.targetCount)}
                  onChange={onChangeCount}
                  step={exercise.unit?.startsWith("sec") ? 5 : 1}
                  unit={exercise.unit ?? "reps"}
                />
              )}
            </div>
          )
        ))}
      {!readOnly && exercise.completed && (exercise.tracksWeight || hasCount) && (
        <p className="font-label mt-0.5 text-sm font-semibold text-neutral-400">
          Logged {exercise.tracksWeight ? `${exercise.actualWeightLbs ?? 0} lbs` : ""}
          {exercise.tracksWeight && hasCount ? " × " : ""}
          {hasCount ? `${exercise.actualCount ?? exercise.targetCount} ${exercise.unit ?? ""}` : ""}
        </p>
      )}
    </div>
  );
}

// Swap menu for a slot -- one chip per option; picking one swaps every set
// of that slot in this workout. Only shown while the slot is untouched, so
// a half-logged lift can't silently change name underneath its numbers.
function SwapMenu({
  exercise,
  locked,
  onSwap,
}: {
  exercise: FitWorkoutExercise;
  locked: boolean;
  onSwap: (option: FitExerciseOption) => void;
}) {
  const [open, setOpen] = useState(false);
  if (exercise.options.length < 2) return null;
  return (
    <div className="border-b border-neutral-100 px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={() => setOpen((o) => !o)}
          className={`font-label inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${
            locked ? "bg-neutral-100 text-neutral-400" : open ? "bg-brand text-white" : "bg-brand/10 text-brand"
          }`}
          aria-expanded={open}
          aria-label={locked ? `${exercise.name} started, can't swap` : open ? "Keep this lift" : `Swap ${exercise.name}`}
        >
          <span aria-hidden="true">⇄</span> {open ? "Keep" : "Swap"}
        </button>
        <span className="font-body min-w-0 text-sm text-neutral-500">
          {locked ? "Started, so it's locked in." : open ? `Swap for ${exercise.name}:` : <>{exercise.name} · <span className="text-neutral-400">Swap before your first set</span></>}
        </span>
      </div>
      {open && !locked && (
        <div className="mt-2 flex flex-wrap gap-2">
          {exercise.options.map((option) => {
            const chosen = option.id === exercise.chosenOptionId || (!exercise.chosenOptionId && option.isDefault);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!chosen) onSwap(option);
                }}
                className={`font-label min-h-11 rounded-full px-4 py-2 text-left text-sm font-semibold ${
                  chosen ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {option.name}
                {option.prescription && <span className={chosen ? "text-white/70" : "text-neutral-400"}> · {option.prescription}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  previous,
  readOnly,
  open,
  onToggleOpen,
  onToggle,
  onChangeCount,
  onChangeWeight,
  onSwap,
}: {
  section: FitWorkoutSectionView;
  previous: FitPreviousResults;
  readOnly: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onToggle: (exercise: FitWorkoutExercise, flavor: SectionFlavor) => void;
  onChangeCount: (exercise: FitWorkoutExercise, value: number) => void;
  onChangeWeight: (exercise: FitWorkoutExercise, value: number) => void;
  onSwap: (exercise: FitWorkoutExercise, option: FitExerciseOption) => void;
}) {
  const flavor = sectionFlavor(section.title);
  const all = section.sets.flatMap((s) => s.exercises);
  const done = all.filter((e) => e.completed).length;
  const allDone = all.length > 0 && done === all.length;
  // The main lift is one exercise over several sets: name it once, then
  // list the sets. Everything else is a circuit: each round lists its moves.
  const singleExercise = new Set(all.map((e) => e.exerciseId)).size === 1;
  const firstExercise = all[0];
  // First set of each distinct slot, in order -- the swap menus key off it.
  const slots = [...new Map(all.map((e) => [e.exerciseId, e])).values()];

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
      <button type="button" onClick={onToggleOpen} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className={`h-9 w-1.5 flex-none rounded-full ${allDone ? "bg-neutral-200" : FLAVOR_BAR[flavor]}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className={`font-label block text-xl leading-tight font-semibold ${allDone ? "text-neutral-400" : "text-neutral-900"}`}>
            {section.title}
            {singleExercise && firstExercise && flavor === "main" && <span className="text-neutral-500">: {firstExercise.name}</span>}
          </span>
          <span className="font-label text-sm font-semibold text-neutral-400">
            {section.setCount && section.setCount > 1 ? `${section.setCount} ${singleExercise ? "sets" : "rounds"} · ` : ""}
            {done}/{all.length} done
          </span>
        </span>
        {allDone ? (
          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-white ${FLAVOR_BAR[flavor]}`}>
            <CheckIcon className="h-4 w-4" />
          </span>
        ) : (
          <ChevronDownIcon open={open} className="h-5 w-5 flex-none text-neutral-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-neutral-100">
          {!readOnly &&
            slots.map((slot) => (
              <SwapMenu
                key={slot.exerciseId}
                exercise={slot}
                locked={all.some((e) => e.exerciseId === slot.exerciseId && e.completed)}
                onSwap={(option) => onSwap(slot, option)}
              />
            ))}
          {singleExercise && firstExercise?.cue && (
            <p className="font-body border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm leading-relaxed text-neutral-600">{firstExercise.cue}</p>
          )}
          {section.sets.map((set) => (
            <div key={set.setNumber}>
              {!singleExercise && section.setCount !== null && section.setCount > 1 && (
                <p className={`font-label border-b border-neutral-100 bg-neutral-50 px-4 py-1.5 text-sm font-semibold ${FLAVOR_TEXT[flavor]}`}>
                  Round {set.setNumber} of {section.setCount}
                </p>
              )}
              <div className="divide-y divide-neutral-100">
                {set.exercises.map((exercise) => (
                  <SetRow
                    key={exercise.logId}
                    exercise={exercise}
                    flavor={flavor}
                    previous={previous.bySet.get(`${exercise.exerciseId}:${exercise.setNumber}`)}
                    showName={!singleExercise}
                    multiSet={section.sets.length > 1}
                    readOnly={readOnly}
                    onToggle={() => onToggle(exercise, flavor)}
                    onChangeCount={(value) => onChangeCount(exercise, value)}
                    onChangeWeight={(value) => onChangeWeight(exercise, value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FitWorkoutScreen() {
  const { workoutLogId } = useParams();
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const userId = authSession!.user.id;
  const [session, setSession] = useState<FitWorkoutSession | null | undefined>(undefined);
  const [previous, setPrevious] = useState<FitPreviousResults>({ bySet: new Map(), lastDone: new Map() });
  const [finishing, setFinishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [cooldownHref, setCooldownHref] = useState<string | null>(null);
  const [prMessage, setPrMessage] = useState<string | null>(null);
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set());
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const vibrated = useRef(false);
  const [beepOn, setBeepOn] = useState(() => {
    try {
      return localStorage.getItem(BEEP_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [summary, setSummary] = useState<FinishSummary | null>(null);

  function toggleBeep() {
    setBeepOn((on) => {
      const next = !on;
      try {
        localStorage.setItem(BEEP_KEY, next ? "1" : "0");
      } catch {
        // private mode -- preference just won't stick
      }
      if (next) playBeep();
      return next;
    });
  }

  useEffect(() => {
    if (!workoutLogId) return;
    getWorkoutSession(workoutLogId).then((result) => {
      setSession(result);
      if (!result) return;
      // Open the first section that still has work in it.
      const firstOpen = result.sections.find((s) => s.sets.some((set) => set.exercises.some((e) => !e.completed))) ?? result.sections[0];
      setOpenSectionIds(new Set(firstOpen ? [firstOpen.id] : []));
      const ids = [...new Set(result.sections.flatMap((s) => s.sets.flatMap((set) => set.exercises.map((e) => e.exerciseId))))];
      getPreviousExerciseResults(userId, ids, result.id).then(setPrevious);
    });
  }, [workoutLogId, userId]);

  // One clock for the elapsed time and the rest timer.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const restLeft = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : null;
  useEffect(() => {
    if (restLeft !== null && restLeft <= 0 && !vibrated.current) {
      vibrated.current = true;
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        // vibration isn't available everywhere; the bar still turns green
      }
      if (beepOn) playBeep();
    }
  }, [restLeft, beepOn]);

  useWakeLock(!!session && session.status !== "completed" && !summary);

  const totals = useMemo(() => {
    if (!session) return { total: 0, done: 0 };
    const all = session.sections.flatMap((s) => s.sets.flatMap((set) => set.exercises));
    return { total: all.length, done: all.filter((e) => e.completed).length };
  }, [session]);

  if (session === undefined) {
    return (
      <div className="mx-auto max-w-md px-4">
        <ScreenSkeleton label="Loading workout" />
      </div>
    );
  }
  if (session === null) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">Couldn't find that workout.</p>
        <Link to="/app/fit" className="font-label text-brand mt-2 inline-block text-base font-semibold">
          Back to your program
        </Link>
      </div>
    );
  }

  const readOnly = session.status === "completed";
  const elapsedMin = Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 60000));

  function updateLocal(logIds: string[], patch: Partial<FitWorkoutExercise>) {
    const ids = new Set(logIds);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) => ({
              ...s,
              sets: s.sets.map((set) => ({ ...set, exercises: set.exercises.map((e) => (ids.has(e.logId) ? { ...e, ...patch } : e)) })),
            })),
          }
        : prev
    );
  }

  function toggleSectionOpen(sectionId: string) {
    setOpenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  async function handleToggle(exercise: FitWorkoutExercise, flavor: SectionFlavor) {
    if (!session) return;
    const completed = !exercise.completed;
    // Checking a set off records concrete numbers: what's in the boxes, else
    // the target, else what was done last time.
    const prev = previous.bySet.get(`${exercise.exerciseId}:${exercise.setNumber}`);
    const actualCount = completed && exercise.actualCount == null ? (exercise.targetCount ?? prev?.count ?? 0) : exercise.actualCount;
    const actualWeightLbs =
      completed && exercise.tracksWeight && exercise.actualWeightLbs == null
        ? (exercise.targetWeightLbs ?? prev?.weightLbs ?? 0)
        : exercise.actualWeightLbs;
    updateLocal([exercise.logId], { completed, actualCount, actualWeightLbs });

    if (completed) {
      const rest = REST_SECONDS[flavor];
      if (rest) {
        vibrated.current = false;
        setRestEndsAt(Date.now() + rest * 1000);
      }
      // When this finishes a section, fold it and open the next one with work left.
      const sectionIndex = session.sections.findIndex((s) => s.sets.some((set) => set.exercises.some((e) => e.logId === exercise.logId)));
      const section = session.sections[sectionIndex];
      const remaining = section.sets.flatMap((set) => set.exercises).filter((e) => !e.completed && e.logId !== exercise.logId);
      if (remaining.length === 0) {
        const next = session.sections
          .slice(sectionIndex + 1)
          .find((s) => s.sets.some((set) => set.exercises.some((e) => !e.completed)));
        setOpenSectionIds((prevOpen) => {
          const n = new Set(prevOpen);
          n.delete(section.id);
          if (next) n.add(next.id);
          return n;
        });
      }
    }
    await updateExerciseLog(exercise.logId, { completed, actualCount, actualWeightLbs });
  }

  async function handleCountChange(exercise: FitWorkoutExercise, value: number) {
    updateLocal([exercise.logId], { actualCount: value });
    await updateExerciseLog(exercise.logId, { actualCount: value });
  }

  // Setting a weight carries forward to this exercise's later sets that
  // haven't been touched yet -- load the bar once, not five times.
  async function handleWeightChange(exercise: FitWorkoutExercise, value: number) {
    if (!session) return;
    const later = session.sections
      .flatMap((s) => s.sets.flatMap((set) => set.exercises))
      .filter((e) => e.exerciseId === exercise.exerciseId && e.setNumber > exercise.setNumber && !e.completed && e.actualWeightLbs == null);
    updateLocal([exercise.logId, ...later.map((e) => e.logId)], { actualWeightLbs: value });
    await Promise.all([exercise, ...later].map((e) => updateExerciseLog(e.logId, { actualWeightLbs: value })));
  }

  async function handleSwap(exercise: FitWorkoutExercise, option: FitExerciseOption) {
    if (!workoutLogId || !session) return;
    const logIds = session.sections
      .flatMap((s) => s.sets.flatMap((set) => set.exercises))
      .filter((e) => e.exerciseId === exercise.exerciseId)
      .map((e) => e.logId);
    updateLocal(logIds, { chosenOptionId: option.id, name: option.name, cue: option.cue ?? exercise.cue });
    await chooseExerciseOption(workoutLogId, exercise.exerciseId, option.id);
  }

  async function handleFinish() {
    if (!workoutLogId) return;
    setFinishing(true);
    try {
      const prs = await finishWorkout(workoutLogId);
      const date = todayISO();
      // Summary numbers are best-effort -- a failed lookup shows a dash.
      const [streaks, weekDone, block, found] = await Promise.all([
        getFitStreaks(userId).catch(() => null),
        countSessionsDoneBetween(userId, mondayOfISO(date), date).catch(() => null),
        getActiveFitBlock(userId).catch(() => null),
        getDrillForDate(date).catch(() => null),
      ]);
      let next = "/app/library";
      if (found) {
        const existingScore = await getMyScoreForDate(userId, found.drill.id, date).catch(() => null);
        next = existingScore !== null ? "/app/fit/today" : "/app/today";
      }
      setSummary({
        setsDone: totals.done,
        setsTotal: totals.total,
        minutes: elapsedMin,
        prs,
        streak: streaks?.training.sessions ?? null,
        weekDone: weekDone?.done ?? null,
        weekGoal: block ? block.sessionsPerWeek + (weekDone?.yogaPerWeek ?? 0) : null,
        next,
      });
      if (prs.length > 0) setPrMessage(prs.length === 1 ? `New PR: ${prs[0].label}!` : `${prs.length} new PRs!`);
    } finally {
      setFinishing(false);
    }
  }

  async function handleDiscard() {
    if (!workoutLogId) return;
    setDiscarding(true);
    try {
      await abandonWorkout(workoutLogId);
      navigate("/app/fit/today");
    } finally {
      setDiscarding(false);
    }
  }

  const lastDoneAt = [...previous.lastDone.values()].sort().pop();

  return (
    <div className={`mx-auto max-w-md px-4 pt-5 ${readOnly ? "pb-28" : "pb-44"}`}>
      <Link to={readOnly ? "/app/fit/history" : "/app/fit/today"} className="font-label -ml-1 inline-flex items-center gap-0.5 text-base font-semibold text-neutral-500">
        <ChevronLeft className="h-4 w-4" />
        {readOnly ? "History" : "Today"}
      </Link>

      <div className="bg-brand-dark mt-2 overflow-hidden rounded-3xl p-5 text-white">
        <p className="font-label text-base font-medium text-white/60">
          {readOnly
            ? `Done ${session.completedAt ? `${formatDay(session.completedAt)}, ${formatTime(session.completedAt)}` : ""}`
            : `Started ${formatTime(session.startedAt)} · ${elapsedMin} min`}
        </p>
        <h1 className="font-display mt-1 text-[2.6rem] leading-[0.95] tracking-wide">{session.templateName}</h1>
        {lastDoneAt && !readOnly && <p className="font-body mt-1 text-sm text-white/60">Last time: {formatDay(lastDoneAt)}</p>}
        <div className="mt-4">
          <div className="font-label mb-1.5 flex justify-between text-sm font-semibold text-white/60">
            <span>Progress</span>
            <span className="text-white">
              {totals.done} of {totals.total}
            </span>
          </div>
          <Meter value={totals.done} max={totals.total} tone="bg-gold" track="bg-white/10" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {session.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            previous={previous}
            readOnly={readOnly}
            open={readOnly || openSectionIds.has(section.id)}
            onToggleOpen={() => toggleSectionOpen(section.id)}
            onToggle={handleToggle}
            onChangeCount={handleCountChange}
            onChangeWeight={handleWeightChange}
            onSwap={handleSwap}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => setConfirmDiscard(true)}
          className="font-label mt-6 w-full py-2 text-center text-base font-semibold text-neutral-400"
        >
          Discard workout
        </button>
      )}

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 border-t border-black/[0.06] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
            {restLeft !== null && restLeft > -30 && (
              <>
                <span
                  className={`font-label flex min-h-12 flex-none items-center rounded-full px-4 text-base font-bold tabular-nums ${
                    restLeft > 0 ? "bg-neutral-100 text-neutral-800" : "bg-brand/10 text-brand"
                  }`}
                  role="timer"
                  aria-live="off"
                >
                  {restLeft > 0 ? formatClock(restLeft) : "Go"}
                </span>
                {restLeft > 0 && (
                  <button
                    type="button"
                    onClick={() => setRestEndsAt((t) => (t ?? Date.now()) + 30_000)}
                    className="font-label min-h-12 min-w-12 flex-none rounded-full bg-neutral-100 px-3 text-sm font-bold text-neutral-700"
                    aria-label="Add 30 seconds"
                  >
                    +30s
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRestEndsAt(null)}
                  className="font-label min-h-12 min-w-12 flex-none rounded-full bg-neutral-100 px-3 text-sm font-bold text-neutral-700"
                  aria-label={restLeft > 0 ? "Skip rest" : "Dismiss rest timer"}
                >
                  {restLeft > 0 ? "Skip" : "✕"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={toggleBeep}
              aria-pressed={beepOn}
              aria-label={beepOn ? "Rest beep on" : "Rest beep off"}
              className={`flex min-h-12 min-w-12 flex-none items-center justify-center rounded-full text-lg ${beepOn ? "bg-brand/10 text-brand" : "bg-neutral-100 text-neutral-400"}`}
            >
              {beepOn ? "🔔" : "🔕"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing || discarding}
              className="font-label bg-brand min-h-12 min-w-0 flex-1 rounded-full px-4 py-3 text-base font-bold text-white disabled:opacity-60"
            >
              {finishing ? "Saving…" : totals.done === totals.total ? "Finish workout" : `Finish (${totals.done}/${totals.total})`}
            </button>
          </div>
        </div>
      )}

      {prMessage && <CelebrationToast message={prMessage} particles={["🏋️", "🔥", "🏆", "💪"]} onDone={() => setPrMessage(null)} />}
      {confirmDiscard && <DiscardPrompt busy={discarding} onConfirm={handleDiscard} onCancel={() => setConfirmDiscard(false)} />}
      {summary && (
        <FinishSummarySheet
          summary={summary}
          onContinue={() => {
            const next = summary.next;
            setSummary(null);
            if (next === "/app/fit/today") navigate(next);
            else setCooldownHref(next);
          }}
        />
      )}
      {cooldownHref && <CooldownPrompt onConfirm={() => navigate(cooldownHref)} onDismiss={() => navigate("/app/fit/today")} />}
    </div>
  );
}
