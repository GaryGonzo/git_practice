import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const MIN_GAP_PERCENT = 4;
const MAX_GAP_PERCENT = 35;
const DEFAULT_GAP_PERCENT = 12;
const GAP_STEP = 2;

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

export function AlignmentCheckerScreen() {
  const [gapPercent, setGapPercent] = useState(DEFAULT_GAP_PERCENT);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  function adjustGap(delta: number) {
    setGapPercent((g) => Math.min(MAX_GAP_PERCENT, Math.max(MIN_GAP_PERCENT, g + delta)));
  }

  if (cameraState === "active") {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.9)]" />
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.9)]"
            style={{ left: `${50 - gapPercent}%` }}
          />
          <div className="font-label absolute top-1/4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
            Target Line
          </div>
        </div>

        <button
          type="button"
          onClick={stopCamera}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-8">
          <p className="font-label text-center text-xs font-semibold tracking-widest text-white/70 uppercase">
            Stance Line Spacing
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => adjustGap(-GAP_STEP)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white"
            >
              −
            </button>
            <span className="font-display w-16 text-center text-2xl text-white">{gapPercent}%</span>
            <button
              type="button"
              onClick={() => adjustGap(GAP_STEP)}
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

      <h1 className="font-display mt-3 text-2xl tracking-wide">Alignment Checker</h1>
      <p className="font-body text-sm text-neutral-500">
        Prop your phone on the ground behind the ball, aimed down your target line.
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-body text-sm text-neutral-600">
          The center line is your <span className="font-semibold">target line</span> -- line it up through the ball
          toward where you're aiming. The second line is your{" "}
          <span className="font-semibold">stance line</span>: check that your feet, hips, and shoulders all run
          parallel to it, like a set of railroad tracks pointing just left of target (for a right-handed golfer).
        </p>
      </div>

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
