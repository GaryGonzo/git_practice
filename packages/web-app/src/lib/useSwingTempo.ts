import { useCallback, useEffect, useRef, useState } from "react";

export type MotionPermission = "unknown" | "not-needed" | "granted" | "denied" | "unsupported";
export type SwingPhase = "idle" | "backswing" | "downswing" | "result";

// iOS 13+ requires an explicit user-gesture permission prompt for motion
// sensors, same as DeviceOrientationEvent.
interface IOSDeviceMotionEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

// A swing is one continuous rotational motion, so rotationRate (deg/s, from
// the gyroscope) is the more direct signal -- fall back to acceleration
// magnitude (scaled up to a comparable range) on devices/browsers that
// don't expose rotation rate.
function motionMagnitude(event: DeviceMotionEvent): number {
  const r = event.rotationRate;
  if (r && (r.alpha !== null || r.beta !== null || r.gamma !== null)) {
    const a = r.alpha ?? 0;
    const b = r.beta ?? 0;
    const g = r.gamma ?? 0;
    return Math.sqrt(a * a + b * b + g * g);
  }
  const acc = event.acceleration;
  if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
    const x = acc.x ?? 0;
    const y = acc.y ?? 0;
    const z = acc.z ?? 0;
    return Math.sqrt(x * x + y * y + z * z) * 15;
  }
  return 0;
}

// Empirically-picked thresholds for a hand-held phone swing -- these are
// the first thing to retune against real swings, not device field of view
// or camera geometry, so there's no calibration UI for them yet.
const START_THRESHOLD = 45;
const SETTLE_THRESHOLD = 25;
const MIN_BACKSWING_MS = 150;
const TRANSITION_DROP_RATIO = 0.55;
const MAX_SWING_MS = 3000;

export function useSwingTempo() {
  const [permission, setPermission] = useState<MotionPermission>("unknown");
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<SwingPhase>("idle");
  const [backswingMs, setBackswingMs] = useState<number | null>(null);
  const [downswingMs, setDownswingMs] = useState<number | null>(null);

  const phaseRef = useRef<SwingPhase>("idle");
  const startTimeRef = useRef(0);
  const transitionTimeRef = useRef(0);
  const peakRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const clearSwingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearSwingTimeout();
    phaseRef.current = "idle";
    peakRef.current = 0;
    setPhase("idle");
    setBackswingMs(null);
    setDownswingMs(null);
  }, [clearSwingTimeout]);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const magnitude = motionMagnitude(event);
      const now = performance.now();

      if (phaseRef.current === "idle" || phaseRef.current === "result") {
        if (magnitude > START_THRESHOLD) {
          phaseRef.current = "backswing";
          startTimeRef.current = now;
          peakRef.current = magnitude;
          setBackswingMs(null);
          setDownswingMs(null);
          setPhase("backswing");
          clearSwingTimeout();
          timeoutRef.current = window.setTimeout(reset, MAX_SWING_MS);
        }
        return;
      }

      if (phaseRef.current === "backswing") {
        peakRef.current = Math.max(peakRef.current, magnitude);
        const elapsed = now - startTimeRef.current;
        // The natural pause at the top of the backswing shows up as a dip
        // in angular velocity -- that dip is the transition to downswing.
        if (elapsed > MIN_BACKSWING_MS && magnitude < peakRef.current * TRANSITION_DROP_RATIO) {
          transitionTimeRef.current = now;
          setBackswingMs(elapsed);
          peakRef.current = magnitude;
          phaseRef.current = "downswing";
          setPhase("downswing");
        }
        return;
      }

      if (phaseRef.current === "downswing") {
        peakRef.current = Math.max(peakRef.current, magnitude);
        if (magnitude < SETTLE_THRESHOLD) {
          setDownswingMs(now - transitionTimeRef.current);
          phaseRef.current = "result";
          setPhase("result");
          clearSwingTimeout();
        }
      }
    },
    [clearSwingTimeout, reset]
  );

  const start = useCallback(async () => {
    if (typeof DeviceMotionEvent === "undefined") {
      setPermission("unsupported");
      return;
    }
    const iosApi = DeviceMotionEvent as unknown as IOSDeviceMotionEvent;
    if (typeof iosApi.requestPermission === "function") {
      try {
        const result = await iosApi.requestPermission();
        setPermission(result === "granted" ? "granted" : "denied");
        if (result !== "granted") return;
      } catch {
        setPermission("denied");
        return;
      }
    } else {
      setPermission("not-needed");
    }
    window.addEventListener("devicemotion", handleMotion);
    setListening(true);
  }, [handleMotion]);

  const stop = useCallback(() => {
    window.removeEventListener("devicemotion", handleMotion);
    clearSwingTimeout();
    setListening(false);
  }, [handleMotion, clearSwingTimeout]);

  useEffect(() => {
    if (typeof DeviceMotionEvent === "undefined") setPermission("unsupported");
  }, []);

  useEffect(() => stop, [stop]);

  const ratio = backswingMs !== null && downswingMs !== null && downswingMs > 0 ? backswingMs / downswingMs : null;

  return { permission, listening, phase, backswingMs, downswingMs, ratio, start, stop, reset };
}
