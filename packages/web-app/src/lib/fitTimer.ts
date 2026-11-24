// Guided timer for timed Fit exercises (planks, holds, carries).
//
// Why the old rest timer was silent: it made a new AudioContext at the
// moment the time ran out. On iPhone, audio that isn't started from a tap
// stays suspended, and the ring/silent switch mutes web audio. Here:
//   1. The AudioContext is created and resumed inside the Start tap.
//   2. iOS is asked to treat it as media playback (navigator.audioSession,
//      plus a silent looping <audio> element as a fallback), which plays
//      even with the silent switch on.
//   3. Every beep is scheduled on the audio clock up front, so it lands on
//      time even if the page's JS timers get throttled.

export interface Segment {
  kind: "ready" | "work" | "switch";
  label: string;
  seconds: number;
}

const READY_SEC = 3;
const SWITCH_SEC = 5;

/** Hold length and sides for a timed item, from its fields or its dose text ("30 sec/side"). */
export function holdInfo(item: { dose: string; holdSeconds?: number; sides?: number }): { seconds: number; sides: number } | null {
  if (item.holdSeconds) return { seconds: item.holdSeconds, sides: item.sides ?? 1 };
  const m = item.dose.match(/^(\d+)\s*sec(\/side)?$/);
  if (!m) return null;
  return { seconds: Number(m[1]), sides: m[2] ? 2 : 1 };
}

export function buildSegments(sets: number, holdSeconds: number, sides: number): Segment[] {
  const out: Segment[] = [{ kind: "ready", label: "Get ready", seconds: READY_SEC }];
  for (let s = 1; s <= sets; s++) {
    for (let side = 1; side <= sides; side++) {
      const sideLabel = sides === 2 ? (side === 1 ? " · Left side" : " · Right side") : "";
      out.push({ kind: "work", label: `Set ${s} of ${sets}${sideLabel}`, seconds: holdSeconds });
      if (side < sides) out.push({ kind: "switch", label: "Switch sides", seconds: SWITCH_SEC });
    }
  }
  return out;
}

export function totalSeconds(segments: Segment[]): number {
  return segments.reduce((t, s) => t + s.seconds, 0);
}

/** Where we are at `elapsed` seconds into the timeline. */
export function positionAt(segments: Segment[], elapsed: number): { index: number; remaining: number; done: boolean } {
  let t = 0;
  for (let i = 0; i < segments.length; i++) {
    if (elapsed < t + segments[i].seconds) return { index: i, remaining: t + segments[i].seconds - elapsed, done: false };
    t += segments[i].seconds;
  }
  return { index: segments.length - 1, remaining: 0, done: true };
}

// ---------------------------------------------------------------------------
// Sound

type Beep = { at: number; freq: number; length: number; volume: number };

/** Beeps for the timeline from `fromElapsed` on, in seconds relative to now. */
export function beepPlan(segments: Segment[], fromElapsed: number): Beep[] {
  const beeps: Beep[] = [];
  let t = 0;
  segments.forEach((seg, i) => {
    const start = t;
    const end = t + seg.seconds;
    // Countdown pips in the last 3 seconds of each segment.
    for (const left of [3, 2, 1]) {
      const at = end - left;
      if (at > start) beeps.push({ at, freq: 880, length: 0.12, volume: 0.6 });
    }
    // What the next segment is: high double for "go", low for rest/switch.
    const next = segments[i + 1];
    if (!next) {
      beeps.push({ at: end, freq: 1320, length: 0.18, volume: 0.9 }, { at: end + 0.25, freq: 1320, length: 0.18, volume: 0.9 }, { at: end + 0.5, freq: 1760, length: 0.5, volume: 0.9 });
    } else if (next.kind === "work") {
      beeps.push({ at: end, freq: 1320, length: 0.15, volume: 0.9 }, { at: end + 0.2, freq: 1760, length: 0.35, volume: 0.9 });
    } else {
      beeps.push({ at: end, freq: 660, length: 0.5, volume: 0.8 });
    }
    t = end;
  });
  return beeps.filter((b) => b.at >= fromElapsed - 0.05).map((b) => ({ ...b, at: b.at - fromElapsed }));
}

let ctx: AudioContext | null = null;
let silentLoop: HTMLAudioElement | null = null;

// Half a second of silence as a WAV. Playing it on loop keeps iOS in
// "playback" mode so beeps aren't muted by the silent switch on older iOS.
function silentWavUrl(): string {
  const rate = 8000;
  const samples = rate / 2;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128); // 8-bit silence
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

/**
 * Call directly from a tap handler. Everything that needs the tap's
 * permission happens synchronously, before any await.
 */
export function unlockAudio(): void {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    // Not supported -- the silent loop below covers older iOS.
  }
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctx) {
    if (!ctx) ctx = new Ctx();
    if (ctx.state !== "running") void ctx.resume().catch(() => undefined);
  }
  try {
    if (!silentLoop) {
      silentLoop = new Audio(silentWavUrl());
      silentLoop.loop = true;
      silentLoop.setAttribute("playsinline", "");
    }
    void silentLoop.play().catch(() => undefined);
  } catch {
    // ignore
  }
}

export function releaseAudio(): void {
  silentLoop?.pause();
}

/** Schedule beeps on the audio clock. Returns a function that cancels them. */
export function scheduleBeeps(beeps: Beep[]): () => void {
  if (!ctx) return () => undefined;
  const c = ctx;
  const nodes: OscillatorNode[] = [];
  const now = c.currentTime + 0.05;
  for (const b of beeps) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    // Triangle cuts through better than a pure sine on phone speakers.
    osc.type = "triangle";
    osc.frequency.value = b.freq;
    const t0 = now + b.at;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(b.volume, t0 + 0.01);
    gain.gain.setValueAtTime(b.volume, t0 + b.length - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + b.length);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + b.length + 0.02);
    nodes.push(osc);
  }
  return () => {
    for (const n of nodes) {
      try {
        n.stop();
        n.disconnect();
      } catch {
        // already stopped
      }
    }
  };
}

/** A one-off test beep (Sound check button). */
export function testBeep(): void {
  scheduleBeeps([{ at: 0, freq: 1320, length: 0.15, volume: 0.9 }, { at: 0.2, freq: 1760, length: 0.3, volume: 0.9 }]);
}
