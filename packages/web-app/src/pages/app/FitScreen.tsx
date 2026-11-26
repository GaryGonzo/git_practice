import { useEffect, useRef, useState } from "react";
import { todayISO, getFitRoutineLogs, saveFitRoutineLog, type FitRoutineLog } from "../../lib/golfableApi";
import { useAuth } from "../../lib/AuthProvider";
import { consistency, weekStart, WEEKLY_GOAL } from "../../lib/fitConsistency";
import {
  canSwap,
  generateRoutine,
  swapExercise,
  DURATION_OPTIONS,
  GROUP_LABEL,
  GROUP_ORDER,
  type Routine,
  type RoutineItem,
} from "../../lib/fitGenerator";
import { exerciseHelp, youtubeSearchUrl, youtubeWatchUrl } from "../../lib/exerciseVideos";
import { ChevronLeft, ChevronRight, PageHeader } from "../../components/ui";
import { Dimples } from "../../components/Dimples";
import { FitTimer } from "../../components/FitTimer";
import { holdInfo } from "../../lib/fitTimer";

// Golfable Fit, dumbed down on purpose: pick a length, tap one button,
// do the routine. Today's routine (and what's ticked off) is kept on this
// device so leaving the app mid-session doesn't lose it.

const STORAGE_KEY = "golfable-fit-today";
const LENGTH_KEY = "golfable-fit-length";

interface Saved {
  routine: Routine;
  done: string[];
  /** Set once the finished routine is saved to history. */
  loggedId?: string;
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    return saved.routine?.date === todayISO() ? saved : null;
  } catch {
    return null;
  }
}

function save(saved: Saved | null) {
  try {
    if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage full -- the routine still works for this visit.
  }
}

function loadLength(): number {
  try {
    const n = Number(localStorage.getItem(LENGTH_KEY));
    return DURATION_OPTIONS.includes(n) ? n : 20;
  } catch {
    return 20;
  }
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LengthPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="font-label text-sm font-semibold text-neutral-500">How long do you have?</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {DURATION_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`font-label rounded-xl py-2.5 text-center text-base font-bold ring-1 transition ${
              n === value ? "bg-brand text-white ring-brand" : "bg-white text-neutral-700 ring-black/[0.08] active:bg-neutral-50"
            }`}
          >
            {n}
            <span className="block text-[0.7rem] font-semibold opacity-70">min</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExerciseRow({
  item,
  done,
  onToggle,
  onSwap,
  onTimer,
}: {
  item: RoutineItem;
  done: boolean;
  onToggle: () => void;
  /** Timed exercises only: opens the guided timer. */
  onTimer?: () => void;
  /** Absent when there's nothing left in this group to swap in. */
  onSwap?: () => void;
}) {
  const help = exerciseHelp(item.name);
  const watchUrl = help?.youtubeId ? youtubeWatchUrl(help.youtubeId) : youtubeSearchUrl(item.name);

  return (
    <div className={`flex gap-3 border-t border-neutral-100 py-3.5 first:border-t-0 ${done ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? `Mark ${item.name} not done` : `Mark ${item.name} done`}
        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ring-2 transition ${
          done ? "bg-brand ring-brand text-white" : "ring-neutral-300 text-transparent"
        }`}
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`font-label text-[1.05rem] leading-tight font-semibold ${done ? "line-through" : ""}`}>{item.name}</p>
          <p className="font-display flex-none text-lg leading-none whitespace-nowrap">
            {item.sets} × {item.dose}
          </p>
        </div>
        {item.variation && (
          <span className="font-label bg-brand/10 text-brand mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {item.variation}
          </span>
        )}
        {item.note && <p className="font-label text-gold mt-1 text-sm font-semibold">{item.note}</p>}
        <p className="font-body mt-1 text-sm leading-snug text-neutral-600">{item.cue}</p>
        {item.caution && <p className="font-body mt-1 text-sm text-amber-700">{item.caution}</p>}
        {onTimer && !done && (
          <button
            type="button"
            onClick={onTimer}
            className="font-label bg-brand/10 text-brand mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold active:bg-brand/20"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <circle cx="10" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 8v3.2l2 1.4M8 2.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Start timer
          </button>
        )}
        <div className="mt-1 flex items-center gap-4">
          <a href={watchUrl} target="_blank" rel="noreferrer" className="font-label text-brand text-sm font-semibold underline">
            Watch how
          </a>
          {onSwap && !done && (
            <button type="button" onClick={onSwap} className="font-label flex items-center gap-1 text-sm font-semibold text-neutral-500">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="M4 7h11l-3-3M16 13H5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Swap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function addDaysISO(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

function ConsistencyCard({ logs }: { logs: FitRoutineLog[] | null }) {
  if (!logs) return <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white ring-1 ring-black/[0.06]" />;
  const today = todayISO();
  const c = consistency(
    logs.map((l) => l.completed_on),
    today
  );
  return (
    <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-label text-lg font-semibold text-neutral-800">Consistency</h2>
        <p className="font-label text-sm font-semibold text-neutral-500">Goal: {WEEKLY_GOAL}+ a week</p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          { v: `${c.thisWeek}`, l: "this week", hot: c.thisWeek >= WEEKLY_GOAL },
          { v: `${c.weekStreak}`, l: c.weekStreak === 1 ? "week streak" : "weeks streak", hot: c.weekStreak > 0 },
          { v: `${c.total}`, l: "last 4 weeks", hot: false },
        ].map((x) => (
          <div key={x.l} className="rounded-xl bg-neutral-50 py-2">
            <p className={`font-display text-3xl leading-none ${x.hot ? "text-brand" : "text-neutral-800"}`}>{x.v}</p>
            <p className="font-label text-xs font-semibold text-neutral-500">{x.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5" aria-label="Workouts over the last 4 weeks">
        <div className="grid grid-cols-[3.2rem_repeat(7,1fr)] gap-1.5">
          <span />
          {DOW.map((d, i) => (
            <span key={i} className="font-label text-center text-[0.7rem] font-semibold text-neutral-400">
              {d}
            </span>
          ))}
        </div>
        {c.weeks.map((w) => (
          <div key={w.start} className="grid grid-cols-[3.2rem_repeat(7,1fr)] items-center gap-1.5">
            <span className={`font-label text-xs font-semibold ${w.start === weekStart(today) ? "text-neutral-800" : "text-neutral-400"}`}>
              {w.start === weekStart(today) ? "This wk" : new Date(`${w.start}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            {w.days.map((d) => (
              <span
                key={d.date}
                title={d.date}
                className={`mx-auto h-6 w-full max-w-7 rounded-md ${
                  d.count > 0 ? "bg-brand" : d.future ? "bg-neutral-50" : d.date === today ? "ring-brand/40 bg-neutral-100 ring-2" : "bg-neutral-100"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function FitScreen() {
  const { session, profile } = useAuth();
  // Fit opens on the welcome screen (consistency); the routine is one tap in.
  const [view, setView] = useState<"welcome" | "routine">("welcome");
  const userId = session?.user.id ?? null;
  const [logs, setLogs] = useState<FitRoutineLog[] | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [length, setLength] = useState(loadLength);
  const [saved, setSaved] = useState<Saved | null>(loadSaved);
  const [timerId, setTimerId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getFitRoutineLogs(userId, addDaysISO(weekStart(todayISO()), -21))
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(LENGTH_KEY, String(length));
    } catch {
      // ignore
    }
  }, [length]);

  function generate() {
    const next: Saved = { routine: generateRoutine(length, todayISO()), done: [] };
    setSaved(next);
    save(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggle(id: string) {
    if (!saved) return;
    const done = saved.done.includes(id) ? saved.done.filter((d) => d !== id) : [...saved.done, id];
    const next = { ...saved, done };
    setSaved(next);
    save(next);
  }

  function swap(id: string) {
    if (!saved) return;
    const next = { routine: swapExercise(saved.routine, id), done: saved.done.filter((d) => d !== id) };
    setSaved(next);
    save(next);
  }

  function startOver() {
    setSaved(null);
    save(null);
  }

  const routine = saved?.routine ?? null;
  const doneCount = saved?.done.length ?? 0;
  const allDone = routine !== null && doneCount === routine.items.length;

  const isSaved = !!saved?.loggedId;

  // "Finish & save": logs what was done today to history, once. Saving is
  // always the player's call -- a routine with a skipped exercise still
  // counts.
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  async function finish() {
    if (!saved || saved.loggedId || !userId || savingRef.current || saved.done.length === 0) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      const doneItems = saved.routine.items.filter((i) => saved.done.includes(i.id));
      const id = await saveFitRoutineLog(userId, {
        completedOn: saved.routine.date,
        minutes: saved.routine.minutes,
        exercises: doneItems.map((i) => ({ name: i.name, sets: i.sets, dose: i.dose })),
      });
      const next = { ...saved, loggedId: id };
      setSaved(next);
      save(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      getFitRoutineLogs(userId, addDaysISO(weekStart(todayISO()), -21))
        .then(setLogs)
        .catch(() => {});
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (view === "welcome") {
    const c = logs ? consistency(logs.map((l) => l.completed_on), todayISO()) : null;
    const left = c ? Math.max(0, WEEKLY_GOAL - c.thisWeek) : null;
    const status =
      left === null
        ? ""
        : left === 0
          ? "Weekly goal hit. Keep it rolling."
          : `${left} more ${left === 1 ? "workout" : "workouts"} to hit this week's goal.`;
    const cta = !routine ? "Today's routine" : isSaved ? "See today's routine" : "Continue today's routine";
    const name = profile?.first_name?.trim();
    return (
      <div className="mx-auto max-w-md px-4 pb-28">
        <PageHeader kicker="Golfable Fit" title={name ? `Welcome back, ${name}` : "Welcome back"} sub={status || "Core, glutes and shoulders, built for your swing."} />
        <ConsistencyCard logs={logs} />
        <div className="bg-brand-dark mt-4 flex items-center gap-3 overflow-hidden rounded-2xl py-3 pr-4 pl-2 text-white">
          <Dimples pose={isSaved ? "celebrate" : "balance"} onDark className="h-24 w-20 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.7rem] leading-none tracking-wide">
              {isSaved ? "Today's done." : routine ? "Pick up where you left off." : "Ready to train?"}
            </p>
            <p className="font-body mt-1 text-sm text-white/70">
              {isSaved
                ? "Saved to your history."
                : routine
                  ? `${doneCount} of ${routine.items.length} exercises done${doneCount > 0 ? " · tap Finish & save when you're through" : ""}`
                  : "15 to 60 minutes. Low impact."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setView("routine");
            window.scrollTo({ top: 0 });
          }}
          className="font-label bg-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-bold text-white shadow-lg shadow-black/10 active:scale-[0.99]"
        >
          {cta}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <button
        type="button"
        onClick={() => setView("welcome")}
        className="font-label -ml-1 flex items-center gap-0.5 pt-4 text-base font-semibold text-neutral-500"
      >
        <ChevronLeft className="h-4 w-4" />
        Fit home
      </button>
      <PageHeader title={routine ? "Today's routine" : "Train today"} sub="Core, glutes and shoulders. Low impact, built for your swing." />

      {!routine ? (
        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
          <LengthPicker value={length} onChange={setLength} />
          <button
            type="button"
            onClick={generate}
            className="font-label bg-brand mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-bold text-white shadow-lg shadow-black/10 active:scale-[0.99]"
          >
            <SparkIcon className="h-5 w-5" />
            Generate today's routine
          </button>
        </div>
      ) : null}
      {routine && (
        <>
          <div className="bg-brand-dark mt-5 flex items-center justify-between rounded-2xl px-5 py-4 text-white">
            <div>
              <p className="font-display text-3xl leading-none">{routine.minutes} min</p>
              <p className="font-body mt-1 text-sm text-white/70">
                {routine.items.length} exercises · about {routine.estimatedMinutes} min with rest
              </p>
            </div>
            <div className="text-right">
              <p className={`font-display text-3xl leading-none ${isSaved || allDone ? "text-gold" : ""}`}>
                {doneCount}/{routine.items.length}
              </p>
              <p className="font-body mt-1 text-sm text-white/70">
                {isSaved ? "Saved" : "done"}
              </p>
            </div>
          </div>
          {saveError && (
            <button
              type="button"
              onClick={finish}
              className="font-label mt-2 w-full rounded-xl bg-red-50 py-2 text-sm font-bold text-red-700"
            >
              Couldn't save this workout. Tap to try again.
            </button>
          )}
          <p className="font-body mt-3 text-sm text-neutral-500">Rest about 30 seconds between sets.</p>

          {GROUP_ORDER.map((group) => {
            const items = routine.items.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <section key={group} className="mt-4">
                <h2 className="font-label text-lg font-semibold text-neutral-800">{GROUP_LABEL[group]}</h2>
                <div className="mt-1.5 rounded-2xl bg-white px-4 ring-1 ring-black/[0.06]">
                  {items.map((item) => (
                    <ExerciseRow
                      key={item.id}
                      item={item}
                      done={saved!.done.includes(item.id)}
                      onToggle={() => toggle(item.id)}
                      onSwap={canSwap(routine, item.id) ? () => swap(item.id) : undefined}
                      onTimer={holdInfo(item) ? () => setTimerId(item.id) : undefined}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {isSaved ? (
            <div className="bg-brand-dark mt-6 flex items-center gap-3 rounded-2xl py-3 pr-4 pl-2 text-white">
              <Dimples pose="celebrate" onDark className="h-20 w-16 flex-none" />
              <div>
                <p className="font-display text-gold text-[1.7rem] leading-none tracking-wide">Workout saved.</p>
                <p className="font-body mt-1 text-sm text-white/70">
                  {saved!.done.length} {saved!.done.length === 1 ? "exercise" : "exercises"} logged to your history.
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={doneCount === 0 || saving}
              className={`font-label mt-6 flex w-full flex-col items-center justify-center rounded-xl px-4 py-4 text-lg font-bold shadow-lg shadow-black/10 active:scale-[0.99] disabled:opacity-40 ${
                allDone ? "bg-gold text-brand-dark" : "bg-brand text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5" />
                {saving ? "Saving…" : "Finish & save workout"}
              </span>
              <span className="font-body text-xs font-medium opacity-80">
                {doneCount === 0
                  ? "Check off an exercise first"
                  : allDone
                    ? `All ${routine.items.length} exercises done`
                    : `${doneCount} of ${routine.items.length} done · saves what you did`}
              </span>
            </button>
          )}

          <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <LengthPicker value={length} onChange={setLength} />
            <button
              type="button"
              onClick={generate}
              className="font-label bg-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-white"
            >
              <SparkIcon className="h-4 w-4" />
              Generate a new routine
            </button>
            <button type="button" onClick={startOver} className="font-label mt-2 w-full py-2 text-sm font-semibold text-neutral-500">
              Clear today's routine
            </button>
          </div>
        </>
      )}
      {(() => {
        const item = routine?.items.find((i) => i.id === timerId);
        const info = item ? holdInfo(item) : null;
        if (!item || !info) return null;
        return (
          <FitTimer
            name={item.name}
            sets={item.sets}
            holdSeconds={info.seconds}
            sides={info.sides}
            onClose={() => setTimerId(null)}
            onFinished={() => {
              if (!saved?.done.includes(item.id)) toggle(item.id);
            }}
          />
        );
      })()}
    </div>
  );
}
