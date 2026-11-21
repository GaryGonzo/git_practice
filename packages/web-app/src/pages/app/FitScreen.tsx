import { useEffect, useState } from "react";
import { todayISO } from "../../lib/golfableApi";
import {
  generateRoutine,
  DURATION_OPTIONS,
  GROUP_LABEL,
  GROUP_ORDER,
  type Routine,
  type RoutineItem,
} from "../../lib/fitGenerator";
import { exerciseHelp, youtubeSearchUrl, youtubeWatchUrl } from "../../lib/exerciseVideos";
import { PageHeader } from "../../components/ui";

// Golfable Fit, dumbed down on purpose: pick a length, tap one button,
// do the routine. Today's routine (and what's ticked off) is kept on this
// device so leaving the app mid-session doesn't lose it.

const STORAGE_KEY = "golfable-fit-today";
const LENGTH_KEY = "golfable-fit-length";

interface Saved {
  routine: Routine;
  done: string[];
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

function ExerciseRow({ item, done, onToggle }: { item: RoutineItem; done: boolean; onToggle: () => void }) {
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
        <a href={watchUrl} target="_blank" rel="noreferrer" className="font-label text-brand mt-1 inline-block text-sm font-semibold underline">
          Watch how
        </a>
      </div>
    </div>
  );
}

export function FitScreen() {
  const [length, setLength] = useState(loadLength);
  const [saved, setSaved] = useState<Saved | null>(loadSaved);

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

  function startOver() {
    setSaved(null);
    save(null);
  }

  const routine = saved?.routine ?? null;
  const doneCount = saved?.done.length ?? 0;
  const allDone = routine !== null && doneCount === routine.items.length;

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <PageHeader kicker="Golfable Fit" title={routine ? "Today's routine" : "Train today"} sub="Core, glutes and shoulders. Low impact, built for your swing." />

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
      ) : (
        <>
          <div className="bg-brand-dark mt-5 flex items-center justify-between rounded-2xl px-5 py-4 text-white">
            <div>
              <p className="font-display text-3xl leading-none">{routine.minutes} min</p>
              <p className="font-body mt-1 text-sm text-white/70">
                {routine.items.length} exercises · about {routine.estimatedMinutes} min with rest
              </p>
            </div>
            <div className="text-right">
              <p className={`font-display text-3xl leading-none ${allDone ? "text-gold" : ""}`}>
                {doneCount}/{routine.items.length}
              </p>
              <p className="font-body mt-1 text-sm text-white/70">{allDone ? "Done. Nice work." : "done"}</p>
            </div>
          </div>
          <p className="font-body mt-3 text-sm text-neutral-500">Rest about 30 seconds between sets.</p>

          {GROUP_ORDER.map((group) => {
            const items = routine.items.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <section key={group} className="mt-4">
                <h2 className="font-label text-lg font-semibold text-neutral-800">{GROUP_LABEL[group]}</h2>
                <div className="mt-1.5 rounded-2xl bg-white px-4 ring-1 ring-black/[0.06]">
                  {items.map((item) => (
                    <ExerciseRow key={item.id} item={item} done={saved!.done.includes(item.id)} onToggle={() => toggle(item.id)} />
                  ))}
                </div>
              </section>
            );
          })}

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
    </div>
  );
}
