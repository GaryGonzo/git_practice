import { Link } from "react-router-dom";
import { useMetronome } from "../../lib/useMetronome";

const MIN_BPM = 40;
const MAX_BPM = 240;
const DEFAULT_BPM = 80;
const TEMPO_PRESETS = [
  { label: "Slow", bpm: 60 },
  { label: "Medium", bpm: 80 },
  { label: "Fast", bpm: 100 },
];

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9 6.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="7" y="6" width="3.5" height="12" rx="1" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="1" />
    </svg>
  );
}

export function MetronomeScreen() {
  const { bpm, setBpm, isPlaying, start, stop, beatFlash } = useMetronome(DEFAULT_BPM);

  function adjust(delta: number) {
    setBpm((b) => Math.min(MAX_BPM, Math.max(MIN_BPM, b + delta)));
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link
        to="/app/tools"
        className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500"
      >
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Metronome</h1>
      <p className="font-body text-sm text-neutral-500">Dial in a consistent swing tempo.</p>

      <div className="mt-10 flex flex-col items-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          {isPlaying && (
            <span key={beatFlash} className="bg-brand/50 absolute inline-flex h-full w-full animate-ping rounded-full" />
          )}
          <span className={`relative inline-flex h-20 w-20 rounded-full ${isPlaying ? "bg-brand" : "bg-neutral-200"}`} />
        </div>

        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => adjust(-5)}
            aria-label="Decrease tempo by 5"
            className="font-label flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-lg font-semibold text-neutral-600"
          >
            −
          </button>
          <div className="text-center">
            <span className="font-display text-6xl leading-none tabular-nums">{bpm}</span>
            <p className="font-label mt-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">BPM</p>
          </div>
          <button
            type="button"
            onClick={() => adjust(5)}
            aria-label="Increase tempo by 5"
            className="font-label flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-lg font-semibold text-neutral-600"
          >
            +
          </button>
        </div>

        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="accent-brand mt-6 w-full"
        />

        <div className="mt-4 flex gap-2">
          {TEMPO_PRESETS.map((preset) => (
            <button
              key={preset.bpm}
              type="button"
              onClick={() => setBpm(preset.bpm)}
              className={`font-label rounded-full border px-3 py-1.5 text-sm font-semibold ${
                bpm === preset.bpm ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
              }`}
            >
              {preset.label} · {preset.bpm}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={isPlaying ? stop : start}
          className="bg-brand mt-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg shadow-black/10"
        >
          {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
        </button>
      </div>
    </div>
  );
}
