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

// Empirically-picked thresholds for a hand-held phone swing -- retuned
// after real-world testing showed the original version was too trigger-
// happy on minor/incidental motion. Two changes address that:
//   1. An exponential moving average smooths out single-sample sensor
//      noise before it's compared against any threshold at all.
//   2. Phase transitions require several consecutive samples past the
//      threshold (DEBOUNCE_SAMPLES) instead of committing on the first
//      one, and the backswing must have reached a real peak
//      (MIN_PEAK_FOR_VALID_SWING) before a dip counts as "the top of the
//      swing" rather than just noise.
const SMOOTHING_ALPHA = 0.35;
const START_THRESHOLD = 60;
const SETTLE_THRESHOLD = 22;
const MIN_BACKSWING_MS = 200;
const TRANSITION_DROP_RATIO = 0.5;
const MIN_PEAK_FOR_VALID_SWING = START_THRESHOLD * 1.4;
const DEBOUNCE_SAMPLES = 3;
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
  const smoothedRef = useRef(0);
  const debounceCountRef = useRef(0);
  const pendingEventTimeRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const clearSwingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearSwingTimeout();
    phaseRef.current = "idle";
    peakRef.current = 0;
    debounceCountRef.current = 0;
    setPhase("idle");
    setBackswingMs(null);
    setDownswingMs(null);
  }, [clearSwingTimeout]);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const raw = motionMagnitude(event);
      smoothedRef.current += SMOOTHING_ALPHA * (raw - smoothedRef.current);
      const magnitude = smoothedRef.current;
      const now = performance.now();

      if (phaseRef.current === "idle" || phaseRef.current === "result") {
        if (magnitude > START_THRESHOLD) {
          phaseRef.current = "backswing";
          startTimeRef.current = now;
          peakRef.current = magnitude;
          debounceCountRef.current = 0;
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
        // in angular velocity -- that dip is the transition to downswing,
        // but only once the backswing was a real motion (cleared a real
        // peak), not just noise that happened to cross the start line.
        const isPlausibleTransition =
          elapsed > MIN_BACKSWING_MS &&
          peakRef.current > MIN_PEAK_FOR_VALID_SWING &&
          magnitude < peakRef.current * TRANSITION_DROP_RATIO;

        if (isPlausibleTransition) {
          if (debounceCountRef.current === 0) pendingEventTimeRef.current = now;
          debounceCountRef.current += 1;
        } else {
          debounceCountRef.current = 0;
        }

        if (debounceCountRef.current >= DEBOUNCE_SAMPLES) {
          transitionTimeRef.current = pendingEventTimeRef.current;
          setBackswingMs(pendingEventTimeRef.current - startTimeRef.current);
          peakRef.current = magnitude;
          debounceCountRef.current = 0;
          phaseRef.current = "downswing";
          setPhase("downswing");
        }
        return;
      }

      if (phaseRef.current === "downswing") {
        peakRef.current = Math.max(peakRef.current, magnitude);

        if (magnitude < SETTLE_THRESHOLD) {
          if (debounceCountRef.current === 0) pendingEventTimeRef.current = now;
          debounceCountRef.current += 1;
        } else {
          debounceCountRef.current = 0;
        }

        if (debounceCountRef.current >= DEBOUNCE_SAMPLES) {
          setDownswingMs(pendingEventTimeRef.current - transitionTimeRef.current);
          debounceCountRef.current = 0;
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
