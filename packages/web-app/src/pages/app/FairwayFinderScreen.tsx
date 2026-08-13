import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_FOV_DEG,
  computeFairwayLines,
  loadCalibratedFovDeg,
  saveCalibratedFovDeg,
} from "../../lib/fairwayFinder";

const WIDTH_PRESETS = [20, 25, 30, 35, 40];
const DISTANCE_PRESETS = [50, 100, 150, 200, 250];
const MIN_FOV = 40;
const MAX_FOV = 100;

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7l1 1.5h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

type CameraState = "idle" | "starting" | "active" | "error";

export function FairwayFinderScreen() {
  const [width, setWidth] = useState(30);
  const [distance, setDistance] = useState(200);
  const [fovDeg, setFovDeg] = useState(DEFAULT_FOV_DEG);
  const [showCalibrate, setShowCalibrate] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setFovDeg(loadCalibratedFovDeg());
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Your browser doesn't support camera access.");
      setCameraState("error");
      return;
    }
    setCameraState("starting");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch {
      setErrorMessage("Couldn't access your camera -- check that Golfable has camera permission.");
      setCameraState("error");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState("idle");
  }

  function updateFov(value: number) {
    setFovDeg(value);
    saveCalibratedFovDeg(value);
  }

  const lines = computeFairwayLines(width, distance, fovDeg);

  if (cameraState === "active") {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.9)]"
            style={{ left: `${lines.leftPercent}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.9)]"
            style={{ left: `${lines.rightPercent}%` }}
          />
          <div className="font-label absolute top-1/3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
            {width} yd @ {distance} yd
          </div>
          {lines.clipped && (
            <div className="font-body absolute top-1/3 mt-8 left-1/2 w-56 -translate-x-1/2 rounded-lg bg-black/70 px-3 py-2 text-center text-xs text-white">
              This fairway is wider than your camera can show at this distance -- move back or shorten the distance.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={stopCamera}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-6">
          <p className="font-label text-center text-xs font-semibold tracking-widest text-white/70 uppercase">
            Fairway Width
          </p>
          <div className="mt-2 flex justify-center gap-2">
            {WIDTH_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWidth(w)}
                className={`font-label rounded-full px-3 py-1.5 text-sm font-semibold ${
                  width === w ? "bg-brand text-white" : "bg-white/15 text-white"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <p className="font-label mt-4 text-center text-xs font-semibold tracking-widest text-white/70 uppercase">
            Distance (yards)
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setDistance((d) => Math.max(20, d - 10))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white"
            >
              −
            </button>
            <span className="font-display w-16 text-center text-2xl text-white">{distance}</span>
            <button
              type="button"
              onClick={() => setDistance((d) => Math.min(300, d + 10))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/tools" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Fairway Finder</h1>
      <p className="font-body text-sm text-neutral-500">
        Point your camera downrange and see exactly where a fairway of your chosen width would be.
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Fairway Width</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WIDTH_PRESETS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              className={`font-label rounded-full border px-3 py-1.5 text-sm font-semibold ${
                width === w ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
              }`}
            >
              {w} yd
            </button>
          ))}
        </div>

        <p className="font-label mt-4 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Distance Downrange
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DISTANCE_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDistance(d)}
              className={`font-label rounded-full border px-3 py-1.5 text-sm font-semibold ${
                distance === d ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
              }`}
            >
              {d} yd
            </button>
          ))}
        </div>

        <p className="font-body mt-4 text-xs text-neutral-500">
          ≈ {(lines.halfAngleDeg * 2).toFixed(1)}° wide at {distance} yards.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowCalibrate((s) => !s)}
        className="font-label mt-3 text-sm font-semibold text-neutral-500 underline"
      >
        {showCalibrate ? "Hide calibration" : "Lines look off? Calibrate for your phone"}
      </button>
      {showCalibrate && (
        <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-body text-sm text-neutral-600">
            Every phone's camera has a different field of view, and there's no way for a browser to read it directly
            -- so this estimate defaults to a typical value. Stand a known distance from two objects a known width
            apart, then adjust until the lines line up.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={MIN_FOV}
              max={MAX_FOV}
              value={fovDeg}
              onChange={(e) => updateFov(Number(e.target.value))}
              className="accent-brand flex-1"
            />
            <span className="font-label w-14 text-right text-sm font-semibold">{fovDeg}°</span>
          </div>
        </div>
      )}

      {errorMessage && <p className="font-body mt-4 text-sm text-red-600">{errorMessage}</p>}

      <button
        type="button"
        onClick={startCamera}
        disabled={cameraState === "starting"}
        className="font-label bg-brand mt-6 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <CameraIcon className="h-5 w-5" />
        {cameraState === "starting" ? "Starting Camera…" : "Open Camera"}
      </button>
    </div>
  );
}
