import { useState } from "react";
import { Link } from "react-router-dom";
import { useMetronome } from "../../lib/useMetronome";

const MIN_BPM = 40;
const MAX_BPM = 240;

type Mode = "regular" | "putting";

// Grounded in the most widely-cited golf tempo research: backswing-to-
// downswing ratio holds at roughly 3:1 for the full swing (the "Tour
// Tempo" finding, from video analysis of pro swings, popularized by John
// Novosel's book of the same name) and roughly 2:1 for putting (commonly
// cited alongside it, e.g. by Golf Digest and short-game instructors).
// These BPM values are a reasonable, commonly-recommended starting point
// for that rhythm on a simple click metronome, not a universal constant --
// the slider below is there so anyone can dial in their own feel.
const REGULAR_PRESETS = [
  { label: "Full Swing", bpm: 76 },
  { label: "Chipping", bpm: 100 },
];
const PUTTING_PRESETS = [{ label: "Putting", bpm: 70 }];

const MODE_COPY: Record<Mode, string> = {
  regular: "Full swing and chipping both hold roughly a 3:1 backswing-to-downswing tempo.",
  putting: "Putting strokes run closer to a 2:1 backstroke-to-throughstroke tempo.",
};

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
  const [mode, setMode] = useState<Mode>("regular");
  const { bpm, setBpm, isPlaying, start, stop, beatFlash } = useMetronome(REGULAR_PRESETS[0].bpm);

  const presets = mode === "regular" ? REGULAR_PRESETS : PUTTING_PRESETS;

  function selectMode(next: Mode) {
    setMode(next);
    setBpm(next === "regular" ? REGULAR_PRESETS[0].bpm : PUTTING_PRESETS[0].bpm);
  }

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
      <p className="font-body mt-1 text-xs text-neutral-400">
        Don't hear anything? Check that Silent/Ring mode is off -- phones mute web app sound the same as any other
        notification.
      </p>

      <div className="mt-6 flex rounded-full border border-neutral-200 bg-white p-0.5">
        {(["regular", "putting"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => selectMode(m)}
            className={`font-label flex-1 rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${
              mode === m ? "bg-brand text-white" : "text-neutral-500"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="font-body mt-2 text-xs text-neutral-500">{MODE_COPY[mode]}</p>

      <div className="mt-8 flex flex-col items-center">
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
          {presets.map((preset) => (
            <button
              key={preset.label}
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
