import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const TARGET_PRESETS = [15, 20, 25, 30];
const DEFAULT_TARGET = 20;
const MAX_HISTORY = 8;
const TICK_MS = 100;

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

export function PreShotTimerScreen() {
  const [targetSeconds, setTargetSeconds] = useState(DEFAULT_TARGET);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const startedAtRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, TICK_MS);
  }

  function stop() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    const finalElapsed = performance.now() - startedAtRef.current;
    setRunning(false);
    setElapsedMs(finalElapsed);
    setHistory((prev) => [finalElapsed, ...prev].slice(0, MAX_HISTORY));
  }

  function reset() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    setRunning(false);
    setElapsedMs(0);
  }

  const overTarget = elapsedMs / 1000 > targetSeconds;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/tools" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Pre-Shot Timer</h1>
      <p className="font-body text-sm text-neutral-500">
        Time your routine from first look at the target to takeaway, and keep it consistent every shot.
      </p>

      <div className="mt-8 flex flex-col items-center">
        <span
          className={`font-display text-7xl leading-none tabular-nums transition-colors ${
            running && overTarget ? "text-red-500" : "text-neutral-900"
          }`}
        >
          {formatSeconds(elapsedMs)}
        </span>
        <p className="font-label mt-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">Seconds</p>

        <div className="mt-6 flex gap-3">
          {!running ? (
            <button
              type="button"
              onClick={start}
              className="font-label bg-brand rounded-full px-8 py-3 text-sm font-semibold text-white"
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="font-label rounded-full bg-red-500 px-8 py-3 text-sm font-semibold text-white"
            >
              Stop
            </button>
          )}
          {!running && elapsedMs > 0 && (
            <button
              type="button"
              onClick={reset}
              className="font-label rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-600"
            >
              Reset
            </button>
          )}
        </div>

        <div className="mt-8 w-full rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Target: {targetSeconds}s
          </p>
          <div className="mt-2 flex gap-2">
            {TARGET_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetSeconds(t)}
                className={`font-label rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  targetSeconds === t ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-6 w-full">
            <p className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
              This Session
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((ms, i) => (
                <span
                  key={i}
                  className={`font-label rounded-full px-3 py-1 text-sm font-semibold ${
                    ms / 1000 > targetSeconds ? "bg-red-50 text-red-600" : "bg-brand/10 text-brand"
                  }`}
                >
                  {formatSeconds(ms)}s
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
