import { useCallback, useEffect, useRef, useState } from "react";

// A naive setInterval-driven click drifts audibly over time because JS
// timers aren't sample-accurate. The standard fix (Chris Wilson's "A Tale
// of Two Clocks") is to run a cheap, imprecise JS loop that just looks
// ahead and schedules exact click times on the Web Audio clock instead --
// the audio hardware clock is what actually stays accurate.
const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const ACCENT_EVERY_N_BEATS = 4;

export function useMetronome(initialBpm: number) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatFlash, setBeatFlash] = useState(0);

  const bpmRef = useRef(bpm);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const scheduleClick = useCallback((time: number, accent: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);

    // The visual pulse doesn't need audio-grade precision -- a plain
    // setTimeout aimed at the same scheduled time reads as in-sync.
    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    window.setTimeout(() => setBeatFlash((f) => f + 1), delayMs);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      scheduleClick(nextNoteTimeRef.current, beatIndexRef.current % ACCENT_EVERY_N_BEATS === 0);
      nextNoteTimeRef.current += 60 / bpmRef.current;
      beatIndexRef.current += 1;
    }
    timerRef.current = window.setTimeout(scheduler, SCHEDULER_INTERVAL_MS);
  }, [scheduleClick]);

  const start = useCallback(async () => {
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;

    // iOS standalone web apps (added to the Home Screen) are especially
    // strict here: resume() can resolve and report state "running" while
    // still producing no actual sound, unless something is *synchronously*
    // played within the original tap, before any await. This silent,
    // effectively-instant blip "unlocks" the audio session for the rest of
    // the session -- a standard mitigation for that WebKit quirk.
    const unlockOsc = ctx.createOscillator();
    const unlockGain = ctx.createGain();
    unlockGain.gain.value = 0;
    unlockOsc.connect(unlockGain);
    unlockGain.connect(ctx.destination);
    unlockOsc.start();
    unlockOsc.stop(ctx.currentTime + 0.001);

    if (ctx.state === "suspended") await ctx.resume();

    beatIndexRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return { bpm, setBpm, isPlaying, start, stop, beatFlash };
}
