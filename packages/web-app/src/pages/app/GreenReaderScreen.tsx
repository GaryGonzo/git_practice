import { Link } from "react-router-dom";
import { useDeviceOrientation } from "../../lib/useDeviceOrientation";

const LEVEL_SIZE = 220;
const DOT_MAX_OFFSET = LEVEL_SIZE / 2 - 18;
const MAX_DISPLAY_DEG = 10;
const FLAT_THRESHOLD_DEG = 1;
const MODERATE_THRESHOLD_DEG = 3;

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LevelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="9" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function magnitudeLabel(magnitude: number): { label: string; dotColor: string; ringColor: string } {
  if (magnitude < FLAT_THRESHOLD_DEG) return { label: "Flat", dotColor: "bg-brand", ringColor: "border-brand" };
  if (magnitude < MODERATE_THRESHOLD_DEG) return { label: "Moderate", dotColor: "bg-gold", ringColor: "border-gold" };
  return { label: "Steep", dotColor: "bg-red-500", ringColor: "border-red-500" };
}

export function GreenReaderScreen() {
  const { permission, active, beta, gamma, start, zero } = useDeviceOrientation();

  const magnitude = Math.sqrt(beta * beta + gamma * gamma);
  const clampedMagnitude = Math.min(magnitude, MAX_DISPLAY_DEG);
  const scale = magnitude === 0 ? 0 : clampedMagnitude / magnitude;
  const dotX = (gamma * scale * DOT_MAX_OFFSET) / MAX_DISPLAY_DEG;
  const dotY = (-beta * scale * DOT_MAX_OFFSET) / MAX_DISPLAY_DEG;
  const gradePercent = Math.tan(magnitude * (Math.PI / 180)) * 100;
  const { label, dotColor, ringColor } = magnitudeLabel(magnitude);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/tools" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Green Reader</h1>
      <p className="font-body text-sm text-neutral-500">
        Lay your phone flat on the green -- the dot drifts toward the downhill side.
      </p>

      {!active ? (
        <div className="mt-8 flex flex-col items-center">
          {permission === "unsupported" ? (
            <p className="font-body max-w-xs text-center text-sm text-neutral-500">
              This device or browser doesn't support motion sensors, so Green Reader can't work here.
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
              <LevelIcon className="h-5 w-5" />
              Enable Level
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center">
          <div
            className={`relative flex items-center justify-center rounded-full border-2 bg-white transition-colors ${ringColor}`}
            style={{ width: LEVEL_SIZE, height: LEVEL_SIZE }}
          >
            <div className="absolute h-full w-px bg-neutral-100" />
            <div className="absolute w-full h-px bg-neutral-100" />
            <div className="absolute h-2 w-2 rounded-full bg-neutral-300" />
            <div
              className={`absolute h-4 w-4 rounded-full transition-[transform] duration-150 ${dotColor}`}
              style={{ transform: `translate(${dotX}px, ${dotY}px)` }}
            />
          </div>

          <p className="font-display mt-6 text-4xl">{label}</p>
          <p className="font-body mt-1 text-sm text-neutral-500">
            {magnitude.toFixed(1)}° · ≈{gradePercent.toFixed(1)}% grade
          </p>

          <button
            type="button"
            onClick={zero}
            className="font-label mt-4 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600"
          >
            Zero on This Spot
          </button>
        </div>
      )}

      <p className="font-body mt-10 text-center text-xs text-neutral-400">
        For practice only -- slope-reading devices aren't permitted during competitive rounds (Rules of Golf 4.3).
      </p>
    </div>
  );
}
