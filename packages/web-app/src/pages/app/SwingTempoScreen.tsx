import { Link } from "react-router-dom";
import { useSwingTempo } from "../../lib/useSwingTempo";

const TOUR_RATIO = 3;
const GOOD_RATIO_TOLERANCE = 0.5;

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TempoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21a8.5 8.5 0 1 0-6-14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function phaseCopy(phase: string): string {
  switch (phase) {
    case "backswing":
      return "Backswing…";
    case "downswing":
      return "Downswing…";
    case "result":
      return "Tempo captured — swing again for another rep";
    default:
      return "Ready — make a smooth practice swing";
  }
}

export function SwingTempoScreen() {
  const { permission, listening, phase, backswingMs, downswingMs, ratio, start, reset } = useSwingTempo();

  const isGoodTempo = ratio !== null && Math.abs(ratio - TOUR_RATIO) <= GOOD_RATIO_TOLERANCE;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/tools" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Swing Tempo</h1>
      <p className="font-body text-sm text-neutral-500">
        Hold your phone in your swinging hand -- no club needed -- and make a smooth practice swing to measure your
        backswing-to-downswing ratio.
      </p>

      {!listening ? (
        <div className="mt-8 flex flex-col items-center">
          {permission === "unsupported" ? (
            <p className="font-body max-w-xs text-center text-sm text-neutral-500">
              This device or browser doesn't support motion sensors, so Swing Tempo can't work here.
            </p>
          ) : permission === "denied" ? (
            <p className="font-body max-w-xs text-center text-sm text-neutral-500">
              Motion access was denied. Enable it for Golfable in your device or browser settings, then reload.
            </p>
          ) : (
            <button
              type="button"
              onClick={start}
              className="font-label bg-brand flex items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white"
            >
              <TempoIcon className="h-5 w-5" />
              Enable Motion
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center">
          <div
            className={`flex h-40 w-40 items-center justify-center rounded-full border-4 transition-colors ${
              phase === "result" ? (isGoodTempo ? "border-brand" : "border-gold") : "border-neutral-200"
            }`}
          >
            {ratio !== null ? (
              <div className="text-center">
                <span className="font-display text-4xl leading-none">{ratio.toFixed(1)}</span>
                <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">: 1</p>
              </div>
            ) : (
              <div
                className={`h-4 w-4 rounded-full ${phase === "idle" ? "bg-neutral-300" : "bg-brand animate-pulse"}`}
              />
            )}
          </div>

          <p className="font-label mt-4 text-sm font-semibold text-neutral-600">{phaseCopy(phase)}</p>

          {backswingMs !== null && downswingMs !== null && (
            <p className="font-body mt-1 text-sm text-neutral-500">
              {(backswingMs / 1000).toFixed(2)}s back · {(downswingMs / 1000).toFixed(2)}s down
            </p>
          )}

          <p className="font-body mt-4 max-w-xs text-center text-xs text-neutral-400">
            Tour average tempo is about 3:1 -- e.g. 0.75s back, 0.25s down. Just swing again any time to measure
            another rep.
          </p>

          {phase === "result" && (
            <button
              type="button"
              onClick={reset}
              className="font-label mt-4 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600"
            >
              Swing Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
