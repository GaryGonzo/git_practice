import { useCallback, useEffect, useRef, useState } from "react";

export type OrientationPermission = "unknown" | "not-needed" | "granted" | "denied" | "unsupported";

// iOS 13+ requires an explicit user-gesture permission prompt for motion
// sensors; Android/desktop browsers expose no such API and just fire the
// event once a listener is attached.
interface IOSDeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export function useDeviceOrientation() {
  const [permission, setPermission] = useState<OrientationPermission>("unknown");
  const [active, setActive] = useState(false);
  // beta: front-back tilt of the surface the phone is resting on, gamma:
  // left-right tilt -- both already zero-offset-corrected.
  const [beta, setBeta] = useState(0);
  const [gamma, setGamma] = useState(0);

  const offsetRef = useRef({ beta: 0, gamma: 0 });
  const latestRef = useRef({ beta: 0, gamma: 0 });

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const nextBeta = (event.beta ?? 0) - offsetRef.current.beta;
    const nextGamma = (event.gamma ?? 0) - offsetRef.current.gamma;
    latestRef.current = { beta: nextBeta, gamma: nextGamma };
    setBeta(nextBeta);
    setGamma(nextGamma);
  }, []);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") setPermission("unsupported");
  }, []);

  const start = useCallback(async () => {
    if (typeof DeviceOrientationEvent === "undefined") {
      setPermission("unsupported");
      return;
    }
    const iosApi = DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent;
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
    window.addEventListener("deviceorientation", handleOrientation);
    setActive(true);
  }, [handleOrientation]);

  const stop = useCallback(() => {
    window.removeEventListener("deviceorientation", handleOrientation);
    setActive(false);
  }, [handleOrientation]);

  // Re-baselines the current reading to zero, so small manufacturing offsets
  // or an imperfectly-flat reference surface don't throw off the reading --
  // rest the phone on a known-level spot and tap Zero before reading a green.
  const zero = useCallback(() => {
    offsetRef.current = {
      beta: latestRef.current.beta + offsetRef.current.beta,
      gamma: latestRef.current.gamma + offsetRef.current.gamma,
    };
  }, []);

  useEffect(() => stop, [stop]);

  return { permission, active, beta, gamma, start, stop, zero };
}
