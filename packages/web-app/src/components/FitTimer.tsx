import { useEffect, useMemo, useRef, useState } from "react";
import {
  beepPlan,
  buildSegments,
  positionAt,
  releaseAudio,
  scheduleBeeps,
  testBeep,
  totalSeconds,
  unlockAudio,
  type Segment,
} from "../lib/fitTimer";

// Guided timer for a timed exercise: "Get ready", then each hold (left and
// right side when it's per side) back to back, with a short switch
// between sides. Beeps on 3-2-1 and at every change; the
// screen stays awake while it runs.

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    const request = () =>
      (navigator as Navigator & { wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => undefined);
    void request();
    const onVisible = () => document.visibilityState === "visible" && void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}

const KIND_STYLE: Record<Segment["kind"], string> = {
  ready: "bg-neutral-800",
  work: "bg-brand",
  switch: "bg-amber-600",
};

function fmt(sec: number): string {
  const s = Math.ceil(sec);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s);
}

export function FitTimer({
  name,
  sets,
  holdSeconds,
  sides,
  onClose,
  onFinished,
}: {
  name: string;
  sets: number;
  holdSeconds: number;
  sides: number;
  onClose: () => void;
  onFinished: () => void;
}) {
  const segments = useMemo(() => buildSegments(sets, holdSeconds, sides), [sets, holdSeconds, sides]);
  const total = totalSeconds(segments);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0); // performance.now() minus elapsed at (re)start
  const cancelRef = useRef<() => void>(() => undefined);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useWakeLock(running);

  // Wall-clock based, so a slow frame never makes the timer drift.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const e = (performance.now() - startRef.current) / 1000;
      setElapsed(Math.min(e, total));
      if (e >= total) {
        setRunning(false);
        if (!finishedRef.current) {
          finishedRef.current = true;
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
          onFinishedRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, total]);

  // Stop sounds when the sheet closes.
  useEffect(
    () => () => {
      cancelRef.current();
      releaseAudio();
    },
    []
  );

  function start() {
    unlockAudio(); // must run inside the tap
    const from = elapsed >= total ? 0 : elapsed;
    finishedRef.current = false;
    setElapsed(from);
    startRef.current = performance.now() - from * 1000;
    cancelRef.current();
    cancelRef.current = scheduleBeeps(beepPlan(segments, from));
    setRunning(true);
  }

  function pause() {
    cancelRef.current();
    setRunning(false);
  }

  function reset() {
    cancelRef.current();
    setRunning(false);
    setElapsed(0);
  }

  const pos = positionAt(segments, elapsed);
  const seg = segments[pos.index];
  const done = pos.done && elapsed >= total;
  const workSegments = segments.filter((s) => s.kind === "work").length;
  const worksDone = segments.slice(0, pos.index + (done ? 1 : 0)).filter((s) => s.kind === "work").length;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" role="dialog" aria-label={`${name} timer`}>
      <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white px-5 pt-4 pb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-label text-lg font-semibold">{name}</p>
          <button type="button" onClick={onClose} className="font-label text-sm font-semibold text-neutral-500">
            Close
          </button>
        </div>

        <div className={`mt-3 rounded-2xl px-4 py-6 text-center text-white transition-colors ${done ? "bg-brand-dark" : KIND_STYLE[seg.kind]}`}>
          <p className="font-label text-lg font-semibold text-white/85">{done ? "Done. Nice work." : seg.label}</p>
          <p className="font-display text-[6.5rem] leading-none tabular-nums" aria-live="polite">
            {done ? "✓" : fmt(pos.remaining)}
          </p>
          {!done && seg.kind === "work" && sides === 2 && <p className="font-body text-sm text-white/75">Then switch sides</p>}
        </div>

        <div className="mt-3 flex justify-center gap-1.5" aria-label={`${worksDone} of ${workSegments} holds done`}>
          {Array.from({ length: workSegments }, (_, i) => (
            <span key={i} className={`h-2 w-6 rounded-full ${i < worksDone ? "bg-brand" : "bg-neutral-200"}`} />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {running ? (
            <button type="button" onClick={pause} className="font-label flex-1 rounded-xl bg-neutral-900 py-4 text-lg font-bold text-white">
              Pause
            </button>
          ) : (
            <button type="button" onClick={start} className="font-label bg-brand flex-1 rounded-xl py-4 text-lg font-bold text-white">
              {done ? "Go again" : elapsed > 0 ? "Resume" : "Start"}
            </button>
          )}
          {elapsed > 0 && !running && !done && (
            <button type="button" onClick={reset} className="font-label rounded-xl bg-neutral-100 px-5 py-4 text-base font-bold text-neutral-700">
              Reset
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            testBeep();
          }}
          className="font-label mt-3 w-full text-center text-sm font-semibold text-neutral-500 underline"
        >
          Sound check
        </button>
        <p className="font-body mt-1 text-center text-xs text-neutral-400">
          Beeps at 3-2-1 and every change. Turn your volume up. Keep this screen open while it runs.
        </p>
      </div>
    </div>
  );
}
