import { useEffect, useState } from "react";
import type { Pose } from "@golfable/shared";

// Dimples: Golfable's mascot. A golf ball in a Golfable-green cap with a
// gold band, white gloves and black shoes.
//
// He's a little jointed rig rather than a set of fixed drawings: hands,
// club, knees, heels, chest turn and face are all numbers, and every pose is
// a short keyframed routine that actually demonstrates the move (a full
// swing with a pause at the top and a held finish, hips turning under a
// quiet chest, a hinge into posture, a one-leg balance with eyes closed...).
// One clock drives it with requestAnimationFrame. Rendered without the
// clock (server render for the share image, reduced motion) he shows a
// representative still frame.

const INK = "#14201b";
const CAP = "#1f4d36";
const GOLD = "#c6a64b";
const DIMPLE = "#e4e8e2";
const SHAFT = "#8a9190";
const HEAD = "#5f6766";

// ---------------------------------------------------------------------------
// The rig

interface Rig {
  /** Upper body + hips offset (feet stay planted). */
  x: number;
  y: number;
  /** Whole figure lift, feet included (jumping). */
  jump: number;
  /** Upper body tilt around the hips, degrees. */
  lean: number;
  /** Chest turn, -1 (backswing) .. 1 (finish). Slides the face and arms. */
  turn: number;
  /** Swing arc: hands' angle around the chest, degrees (0 = hanging down). */
  th: number;
  /** Wrist hinge: club angle relative to the arms, degrees. */
  hinge: number;
  /** Free hands (poses that aren't holding a club). */
  lhx: number;
  lhy: number;
  rhx: number;
  rhy: number;
  /** Feet (absolute), knee bend (+ out, - in), heel lift 0..1. */
  lfx: number;
  lfy: number;
  rfx: number;
  rfy: number;
  lk: number;
  rk: number;
  lheel: number;
  rheel: number;
  /** Hips slide (hip turn). */
  hs: number;
  /** Face. */
  blink: number;
  lookX: number;
  lookY: number;
  smile: number;
  /** Extras: think bubble opacity, hold count (1..5 shown), grip squeeze. */
  bubble: number;
  count: number;
  squeeze: number;
}

const BASE: Rig = {
  x: 0,
  y: 0,
  jump: 0,
  lean: 0,
  turn: 0,
  th: 0,
  hinge: 0,
  lhx: 30,
  lhy: 104,
  rhx: 90,
  rhy: 104,
  lfx: 50,
  lfy: 124,
  rfx: 70,
  rfy: 124,
  lk: 2,
  rk: 2,
  lheel: 0,
  rheel: 0,
  hs: 0,
  blink: 0,
  lookX: 0,
  lookY: 0,
  smile: 0,
  bubble: 0,
  count: 0,
  squeeze: 0,
};

type Ease = "inOut" | "in" | "out" | "linear" | "step";
interface Key extends Partial<Rig> {
  t: number;
  /** Easing used to arrive at this key from the previous one. */
  e?: Ease;
}

interface Routine {
  dur: number;
  /** "arc": hands ride the swing arc holding a club. "cross": arms folded on the chest. */
  mode: "arc" | "cross" | "free";
  club?: "putter" | "iron";
  /** Swing-arc radius. */
  r?: number;
  /** Time used for still frames. */
  still: number;
  /** When the club meets the ball (scenes launch balls on it). */
  impact?: number;
  keys: Key[];
}

const ADDRESS: Partial<Rig> = { th: 0, hinge: 0, turn: 0, x: 0, lk: 3, rk: 3, lheel: 0, rheel: 0, smile: 0, lookY: 0.8 };

const ROUTINES: Record<Pose, Routine> = {
  // Shoulders rock the putter like a pendulum; eyes stay down; hold the finish.
  putt: {
    dur: 2.6,
    mode: "arc",
    club: "putter",
    r: 29,
    still: 0,
    impact: 1.2,
    keys: [
      { t: 0, ...ADDRESS, lookY: 1 },
      { t: 0.35 },
      { t: 0.95, th: -17, turn: -0.18 },
      { t: 1.2, th: 0, turn: 0, e: "in" },
      { t: 1.5, th: 17, turn: 0.18, e: "out" },
      { t: 2.05 },
      { t: 2.6, th: 0, turn: 0 },
    ],
  },
  // Same stroke, no putter: the arms-and-shoulders triangle on its own.
  arms: {
    dur: 2.6,
    mode: "arc",
    r: 29,
    still: 0.95,
    keys: [
      { t: 0, ...ADDRESS, lookY: 1 },
      { t: 0.35 },
      { t: 0.95, th: -20, turn: -0.22 },
      { t: 1.5, th: 20, turn: 0.22 },
      { t: 2.05 },
      { t: 2.6, th: 0, turn: 0 },
    ],
  },
  // Half swing: a little hinge, quiet legs, hold a chest-high finish.
  chip: {
    dur: 2.8,
    mode: "arc",
    club: "iron",
    still: 0,
    impact: 1.55,
    keys: [
      { t: 0, ...ADDRESS },
      { t: 0.3 },
      { t: 1.05, th: -58, hinge: -28, turn: -0.35, x: -1 },
      { t: 1.25 },
      { t: 1.55, th: 0, hinge: 0, turn: 0, x: 1, e: "in" },
      { t: 1.9, th: 62, hinge: 18, turn: 0.45, x: 2, rheel: 0, lheel: 0.3, e: "out" },
      { t: 2.35 },
      { t: 2.8, th: 0, hinge: 0, turn: 0, x: 0, lheel: 0 },
    ],
  },
  // Full swing: turn and hinge to the top, pause, fire through, hold the
  // finish on the lead leg with the back heel up, then reset.
  swing: {
    dur: 3.4,
    mode: "arc",
    club: "iron",
    still: 2.3,
    impact: 1.75,
    keys: [
      { t: 0, ...ADDRESS },
      { t: 0.35 },
      { t: 1.25, th: -140, hinge: -85, turn: -0.85, x: -3, lk: 6, rk: 0, lookY: 0.5 },
      { t: 1.45 },
      { t: 1.75, th: 0, hinge: 0, turn: 0.1, x: 1, lk: 3, rk: 3, lookY: 0.8, e: "in" },
      { t: 2.1, th: 152, hinge: 70, turn: 0.95, x: 5, lk: -4, rk: 1, lheel: 1, lookY: -0.3, lookX: 0.8, smile: 0.7, e: "out" },
      { t: 2.8 },
      { t: 3.4, ...ADDRESS, lookX: 0 },
    ],
  },
  // Finish Freeze: slow swing, then hold the finish for a slow 5 count.
  finish: {
    dur: 7.2,
    mode: "arc",
    club: "iron",
    still: 3.2,
    keys: [
      { t: 0, ...ADDRESS },
      { t: 0.3 },
      { t: 1.5, th: -135, hinge: -80, turn: -0.8, x: -3, lk: 6, rk: 0, lookY: 0.5 },
      { t: 2.05, th: 0, hinge: 0, turn: 0.1, x: 1, lk: 3, rk: 3, lookY: 0.8 },
      { t: 2.7, th: 152, hinge: 70, turn: 0.95, x: 5, lk: -4, rk: 1, lheel: 1, lookY: -0.3, lookX: 0.8, smile: 0.7, e: "out" },
      { t: 2.8, count: 1, e: "step" },
      { t: 5.8, count: 5.99, e: "linear" },
      { t: 6.15, count: 0, smile: 1, e: "step" },
      { t: 7.2, ...ADDRESS, lookX: 0 },
    ],
  },
  // Grip check: waggle the club and squeeze-release the hands.
  grip: {
    dur: 2.4,
    mode: "arc",
    club: "iron",
    still: 0,
    keys: [
      { t: 0, ...ADDRESS },
      { t: 0.5, th: -9, hinge: -14 },
      { t: 0.95, th: 0, hinge: 0 },
      { t: 1.3, squeeze: 1 },
      { t: 1.7, squeeze: 1 },
      { t: 2.0, squeeze: 0 },
      { t: 2.4 },
    ],
  },
  // Chest turns with arms folded; hips and feet stay put.
  turn: {
    dur: 3.2,
    mode: "cross",
    still: 0.95,
    keys: [
      { t: 0, turn: 0, lk: 3, rk: 3 },
      { t: 0.95, turn: -1, lk: 5, rk: 1 },
      { t: 1.35 },
      { t: 2.35, turn: 1, lk: 1, rk: 5 },
      { t: 2.75 },
      { t: 3.2, turn: 0, lk: 3, rk: 3 },
    ],
  },
  // Hip turns: hands on hips, hips slide-rotate, the opposite knee kicks in,
  // chest and face stay facing forward.
  hips: {
    dur: 3.2,
    mode: "free",
    still: 0.95,
    keys: [
      { t: 0, hs: 0, lk: 3, rk: 3, lhx: 36, lhy: 95, rhx: 84, rhy: 95, lheel: 0, rheel: 0 },
      { t: 0.95, hs: -9, lk: 8, rk: -8, lhx: 28, rhx: 76, rheel: 0.5 },
      { t: 1.35 },
      { t: 2.35, hs: 9, lk: -8, rk: 8, lhx: 44, rhx: 92, rheel: 0, lheel: 0.5 },
      { t: 2.75 },
      { t: 3.2, hs: 0, lk: 3, rk: 3, lhx: 36, rhx: 84, lheel: 0 },
    ],
  },
  // Hinge and hold: hands slide down the thighs to the knees as the hips
  // push back, hold posture, stand tall.
  hinge: {
    dur: 4.4,
    mode: "free",
    still: 2,
    keys: [
      { t: 0, y: 0, lk: 2, rk: 2, lhx: 46, lhy: 100, rhx: 74, rhy: 100, lookY: 0 },
      { t: 0.5 },
      { t: 1.5, y: 10, lk: 8, rk: 8, lhx: 47, lhy: 114, rhx: 73, rhy: 114, lookY: 1 },
      { t: 3.4 },
      { t: 4.4, y: 0, lk: 2, rk: 2, lhx: 46, lhy: 100, rhx: 74, rhy: 100, lookY: 0 },
    ],
  },
  // One-leg balance: shift onto the lead leg, lift the other, arms out,
  // close the eyes and wobble, then set it down.
  balance: {
    dur: 5.4,
    mode: "free",
    still: 2.4,
    keys: [
      { t: 0, x: 0, lfx: 50, lfy: 124, lk: 2, lhx: 30, lhy: 104, rhx: 90, rhy: 104, blink: 0, lean: 0 },
      { t: 0.5 },
      { t: 1.2, x: 4, lfx: 46, lfy: 108, lk: 10, lhx: 8, lhy: 74, rhx: 112, rhy: 74 },
      { t: 1.6, blink: 1 },
      { t: 2.2, lean: 4 },
      { t: 2.8, lean: -3 },
      { t: 3.4, lean: 3 },
      { t: 3.9, lean: 0 },
      { t: 4.2, blink: 0 },
      { t: 4.9, x: 0, lfx: 50, lfy: 124, lk: 2, lhx: 30, lhy: 104, rhx: 90, rhy: 104 },
      { t: 5.4 },
    ],
  },
  // Thinking it through: hand on chin, eyes up, bubble pulsing, a blink.
  think: {
    dur: 2.8,
    mode: "free",
    still: 0.9,
    impact: 1.4,
    keys: [
      { t: 0, lhx: 30, lhy: 104, rhx: 66, rhy: 86, lookX: 0.8, lookY: -0.8, bubble: 0.35, y: 0 },
      { t: 0.9, bubble: 1, y: -1.5 },
      { t: 1.25, blink: 0 },
      { t: 1.35, blink: 1 },
      { t: 1.45, blink: 0 },
      { t: 1.9, bubble: 0.35, y: 0 },
      { t: 2.8 },
    ],
  },
  // Missed it: shoulders up, palms up, eyes to the side. "Eh, next one."
  shrug: {
    dur: 2.2,
    mode: "free",
    still: 0.6,
    keys: [
      { t: 0, y: 0, lhx: 30, lhy: 104, rhx: 90, rhy: 104, lookX: 0, lookY: 0, lean: 0 },
      { t: 0.45, y: -3, lhx: 14, lhy: 84, rhx: 106, rhy: 84, lookX: 1, lookY: -0.4, lean: -4, e: "out" },
      { t: 1.2 },
      { t: 1.6, y: 0, lhx: 30, lhy: 104, rhx: 90, rhy: 104, lookX: 0, lookY: 0, lean: 0 },
      { t: 2.2 },
    ],
  },
  // Personal best: a happy side-to-side shuffle, arms pumping in turn.
  dance: {
    dur: 1.2,
    mode: "free",
    still: 0.3,
    keys: [
      { t: 0, x: -5, lean: -8, jump: 0, lhx: 14, lhy: 30, rhx: 98, rhy: 92, lfx: 44, lfy: 124, rfx: 66, rfy: 120, rheel: 0.6, lheel: 0, smile: 1, lk: 4, rk: 4 },
      { t: 0.3, x: 0, lean: 0, jump: -6, lhx: 20, lhy: 50, rhx: 100, rhy: 50, e: "out" },
      { t: 0.6, x: 5, lean: 8, jump: 0, lhx: 22, lhy: 92, rhx: 106, rhy: 30, lfx: 54, lfy: 120, rfx: 76, rfy: 124, rheel: 0, lheel: 0.6, e: "in" },
      { t: 0.9, x: 0, lean: 0, jump: -6, lhx: 20, lhy: 50, rhx: 100, rhy: 50, e: "out" },
      { t: 1.2, x: -5, lean: -8, jump: 0, lhx: 14, lhy: 30, rhx: 98, rhy: 92, lfx: 44, lfy: 124, rfx: 66, rfy: 120, rheel: 0.6, lheel: 0, e: "in" },
    ],
  },
  // Celebrate: jump with both fists up.
  celebrate: {
    dur: 1.1,
    mode: "free",
    still: 0,
    keys: [
      { t: 0, jump: 0, lhx: 20, lhy: 32, rhx: 100, rhy: 32, smile: 1, lk: 5, rk: 5 },
      { t: 0.5, jump: -11, lhx: 15, lhy: 22, rhx: 105, rhy: 22, lk: 1, rk: 1, e: "out" },
      { t: 1.1, jump: 0, lhx: 20, lhy: 32, rhx: 100, rhy: 32, lk: 5, rk: 5, e: "in" },
    ],
  },
};

/** Timing for scenes that launch balls in step with the stroke. */
export function poseTiming(pose: Pose): { dur: number; impact: number } {
  const r = ROUTINES[pose];
  return { dur: r.dur, impact: r.impact ?? r.dur / 2 };
}

const ease = (e: Ease, u: number) => {
  switch (e) {
    case "linear":
      return u;
    case "step":
      return u < 1 ? 0 : 1;
    case "in":
      return u * u * u;
    case "out":
      return 1 - (1 - u) ** 3;
    default:
      return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  }
};

/** Fill each key with everything before it, so every key is a full rig. */
function resolve(r: Routine): (Rig & { t: number; e: Ease })[] {
  let cur: Rig = { ...BASE };
  return r.keys.map((k) => {
    const { t, e, ...rest } = k;
    cur = { ...cur, ...rest };
    return { ...cur, t, e: e ?? "inOut" };
  });
}

const RESOLVED = Object.fromEntries(Object.entries(ROUTINES).map(([p, r]) => [p, resolve(r)])) as Record<Pose, ReturnType<typeof resolve>>;

export function rigAt(pose: Pose, time: number): Rig {
  const routine = ROUTINES[pose];
  const keys = RESOLVED[pose];
  const t = ((time % routine.dur) + routine.dur) % routine.dur;
  let i = keys.length - 1;
  while (i > 0 && keys[i].t > t) i--;
  const a = keys[i];
  const b = keys[i + 1];
  if (!b) return a;
  const u = ease(b.e, (t - a.t) / Math.max(1e-6, b.t - a.t));
  const out = { ...a } as Rig;
  for (const key of Object.keys(BASE) as (keyof Rig)[]) out[key] = a[key] + (b[key] - a[key]) * u;
  return out;
}

// ---------------------------------------------------------------------------
// Drawing

type Pt = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
function rotate([px, py]: Pt, [cx, cy]: Pt, deg: number): Pt {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c];
}
const f = (n: number) => Math.round(n * 10) / 10;

/** A limb from a to b, bowed `bow` units away from `away`. */
function limbPath(a: Pt, b: Pt, bow: number, away: Pt): string {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if ((mx + nx - away[0]) ** 2 + (my + ny - away[1]) ** 2 < (mx - nx - away[0]) ** 2 + (my - ny - away[1]) ** 2) {
    nx = -nx;
    ny = -ny;
  }
  return `M${f(a[0])} ${f(a[1])} Q${f(mx + nx * bow)} ${f(my + ny * bow)} ${f(b[0])} ${f(b[1])}`;
}

function Club({ grip, angle, kind }: { grip: Pt; angle: number; kind: "putter" | "iron" }) {
  const len = kind === "putter" ? 25 : 29;
  const dx = Math.sin(rad(angle));
  const dy = Math.cos(rad(angle));
  const butt: Pt = [grip[0] - dx * 4, grip[1] - dy * 4];
  const end: Pt = [grip[0] + dx * len, grip[1] + dy * len];
  const gripEnd: Pt = [grip[0] + dx * 6, grip[1] + dy * 6];
  return (
    <g>
      <line x1={f(butt[0])} y1={f(butt[1])} x2={f(end[0])} y2={f(end[1])} stroke={SHAFT} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={f(butt[0])} y1={f(butt[1])} x2={f(gripEnd[0])} y2={f(gripEnd[1])} stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
      <g transform={`translate(${f(end[0])} ${f(end[1])}) rotate(${f(-angle)})`}>
        {kind === "putter" ? (
          <rect x={-9} y={-1} width={18} height={6} rx={2} fill={INK} />
        ) : (
          <path d="M-2 -3 L11 0 L10 6 L-3 3 Z" fill={HEAD} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        )}
      </g>
    </g>
  );
}

const DOTS: Pt[] = [
  [38, 50],
  [46, 44],
  [74, 44],
  [82, 50],
  [32, 62],
  [88, 62],
  [34, 76],
  [86, 76],
  [42, 86],
  [78, 86],
  [52, 91],
  [68, 91],
  [60, 92],
  [40, 66],
  [80, 66],
];

function Figure({ pose, rig, limb }: { pose: Pose; rig: Rig; limb: string }) {
  const routine = ROUTINES[pose];
  const { x, y, lean, turn } = rig;
  const hip: Pt = [60 + x + rig.hs, 95 + y];
  const pivot: Pt = [60 + x, 95 + y];
  const body = (p: Pt): Pt => rotate([p[0] + x, p[1] + y], pivot, lean);
  const center = body([60, 64]);

  // Shoulders slide with the chest turn.
  const shL = body([34 + turn * 7, 76]);
  const shR = body([86 + turn * 7, 76]);

  // Hands.
  let hL: Pt;
  let hR: Pt;
  let club: { grip: Pt; angle: number } | null = null;
  if (routine.mode === "arc") {
    // The arc widens as the hands rise so they clear the body at the top
    // and in the finish.
    const R = (routine.r ?? 30) + (routine.club === "putter" || pose === "arms" ? 0 : 13 * Math.min(1, Math.abs(rig.th) / 120));
    const c = body([60 + turn * 3, 76]);
    const grip: Pt = [c[0] + R * Math.sin(rad(rig.th)), c[1] + R * Math.cos(rad(rig.th))];
    const angle = rig.th + rig.hinge;
    const ux = Math.sin(rad(angle));
    const uy = Math.cos(rad(angle));
    // Trail hand (viewer's left shoulder) sits lower on the grip.
    hL = [grip[0] + ux * 2.6, grip[1] + uy * 2.6];
    hR = [grip[0] - ux * 2.6, grip[1] - uy * 2.6];
    club = { grip, angle };
  } else if (routine.mode === "cross") {
    hL = body([73 + turn * 10, 84]);
    hR = body([47 + turn * 10, 84]);
  } else {
    // Free hands are placed in figure space; poses where the hands move
    // with the chest (balance, think) follow its lean and shift.
    const follow = pose === "balance" || pose === "think" || pose === "shrug" || pose === "dance";
    hL = follow ? body([rig.lhx, rig.lhy]) : [rig.lhx, rig.lhy];
    hR = follow ? body([rig.rhx, rig.rhy]) : [rig.rhx, rig.rhy];
  }

  // Arms and club go behind the ball when the hands are up over the
  // shoulders (top of the swing, finish, arms out or overhead).
  // With a club, the arms always cross in front and the club tucks behind
  // the body once the hands are up.
  const armsBehind = routine.mode === "free" && pose !== "think" && pose !== "hinge";
  const clubBehind = Math.abs(rig.th) > 70;
  const squeeze = 1 + rig.squeeze * 0.18;
  const clubEl = club && routine.club ? <Club grip={club.grip} angle={club.angle} kind={routine.club} /> : null;

  const arms = (
    <g>
      {!clubBehind && clubEl}
      <path d={limbPath(shL, hL, routine.mode === "cross" ? 6 : 7, center)} fill="none" stroke={limb} strokeWidth={4.6} strokeLinecap="round" />
      <path d={limbPath(shR, hR, routine.mode === "cross" ? 6 : 7, center)} fill="none" stroke={limb} strokeWidth={4.6} strokeLinecap="round" />
      <circle cx={f(hL[0])} cy={f(hL[1])} r={f(5.2 * squeeze)} fill="#fff" stroke={limb} strokeWidth={2.4} />
      <circle cx={f(hR[0])} cy={f(hR[1])} r={f(5.2 * squeeze)} fill="#fff" stroke={limb} strokeWidth={2.4} />
    </g>
  );

  // Legs: hips to planted feet, knees bowed.
  const leg = (from: Pt, foot: Pt, knee: number, heel: number, side: -1 | 1) => {
    const shoeX = foot[0] + side * 4 - side * heel * 2;
    const shoeY = foot[1] + 3 - heel * 2.5;
    const away: Pt = [hip[0] - side * 40, from[1]];
    return (
      <g>
        <path d={limbPath(from, foot, knee, away)} stroke={limb} strokeWidth={5} strokeLinecap="round" fill="none" />
        <ellipse
          cx={f(shoeX)}
          cy={f(shoeY)}
          rx={9.5 - heel * 3}
          ry={4.6}
          fill={limb}
          transform={heel > 0.02 ? `rotate(${f(side * -heel * 35)} ${f(shoeX)} ${f(shoeY)})` : undefined}
        />
      </g>
    );
  };

  const face = turn * 9;
  const eyeRy = 6.8 * (1 - rig.blink);
  const happy = rig.smile > 0.5;
  const px = rig.lookX * 1.6;
  const py = rig.lookY * 1.8;

  return (
    <g transform={rig.jump ? `translate(0 ${f(rig.jump)})` : undefined}>
      {leg([hip[0] - 7, hip[1]], [rig.lfx, rig.lfy], rig.lk, rig.lheel, -1)}
      {leg([hip[0] + 7, hip[1]], [rig.rfx, rig.rfy], rig.rk, rig.rheel, 1)}
      {armsBehind && arms}
      {clubBehind && clubEl}
      <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(lean)} 60 95)`}>
        <circle cx={60} cy={64} r={33} fill="#fff" stroke={INK} strokeWidth={3} />
        {DOTS.map(([dx, dy]) => (
          <circle key={`${dx}-${dy}`} cx={f(dx + turn * 3)} cy={dy} r={2.6} fill={DIMPLE} />
        ))}
        <path d={`M${f(36 + turn * 3)} 82 Q${f(60 + turn * 3)} 102 ${f(84 + turn * 3)} 82`} fill="none" stroke={DIMPLE} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        {/* face */}
        <g transform={`translate(${f(face)} 0)`}>
          {happy ? (
            <>
              <path d="M45 62 Q50 56 55 62" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
              <path d="M65 62 Q70 56 75 62" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
            </>
          ) : eyeRy < 1.6 ? (
            <>
              <path d="M45 62 Q50 65 55 62" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
              <path d="M65 62 Q70 65 75 62" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx={50} cy={61} rx={5.6} ry={f(eyeRy)} fill="#fff" stroke={INK} strokeWidth={2.2} />
              <ellipse cx={70} cy={61} rx={5.6} ry={f(eyeRy)} fill="#fff" stroke={INK} strokeWidth={2.2} />
              <circle cx={f(50.6 + px)} cy={f(61.6 + py)} r={3.2} fill={INK} />
              <circle cx={f(70.6 + px)} cy={f(61.6 + py)} r={3.2} fill={INK} />
              <circle cx={f(51.7 + px)} cy={f(60.2 + py)} r={1.1} fill="#fff" />
              <circle cx={f(71.7 + px)} cy={f(60.2 + py)} r={1.1} fill="#fff" />
            </>
          )}
          <ellipse cx={42} cy={72} rx={4.2} ry={2.4} fill="#f4b9a4" opacity={0.8} />
          <ellipse cx={78} cy={72} rx={4.2} ry={2.4} fill="#f4b9a4" opacity={0.8} />
          {happy ? (
            <path d="M51 73 Q60 84 69 73 Z" fill={INK} />
          ) : (
            <path d="M53 74 Q60 80 67 74" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          )}
        </g>
        {/* cap */}
        <path d="M29 52 C29 22 91 22 91 52 Z" fill={CAP} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M29.5 49 H90.5 V53 H29.5 Z" fill={GOLD} />
        <path d="M86 50 C98 49 110 51 112 56 C104 58 94 57 86 55 Z" fill={CAP} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <circle cx={f(60 + turn * 6)} cy={27.5} r={2.8} fill={GOLD} />
        <path d={`M${f(60 + turn * 6)} 30 V48`} stroke="#2c6347" strokeWidth={1.4} />
      </g>
      {!armsBehind && arms}

      {rig.bubble > 0.01 && (
        <g opacity={f(rig.bubble)}>
          <circle cx={98} cy={34} r={3} fill="#fff" stroke={INK} strokeWidth={1.6} />
          <circle cx={106} cy={24} r={4.5} fill="#fff" stroke={INK} strokeWidth={1.6} />
          <ellipse cx={104} cy={10} rx={14} ry={9} fill="#fff" stroke={INK} strokeWidth={1.8} />
          <path d="M97 10 h1 M104 10 h1 M111 10 h1" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      )}
      {rig.count >= 1 && (
        <g>
          <circle cx={16} cy={22} r={13} fill={GOLD} stroke={INK} strokeWidth={2} />
          <text x={16} y={29.5} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily="'Bebas Neue', Impact, sans-serif" fill={INK}>
            {Math.floor(rig.count)}
          </text>
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Clock

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function useClock(enabled: boolean): number | null {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return t;
}

export function Dimples({
  pose = "putt",
  className,
  title = "Dimples, the Golfable mascot",
  onDark = false,
  still = false,
}: {
  pose?: Pose;
  className?: string;
  title?: string;
  /** Light arms and legs so they show up on dark backgrounds. */
  onDark?: boolean;
  /** Draw a single frame (no animation). */
  still?: boolean;
}) {
  const t = useClock(!still);
  const rig = rigAt(pose, t ?? ROUTINES[pose].still);
  const limb = onDark ? "#efe9da" : INK;
  return (
    <svg viewBox="0 0 120 150" className={`dmp ${className ?? ""}`} role="img" aria-label={title}>
      <ellipse cx={60} cy={132} rx={34} ry={4} fill="#000" opacity={0.08} />
      <Figure pose={pose} rig={rig} limb={limb} />
    </svg>
  );
}

/** One frame of a pose at a given time (contact sheets, exports). */
export function DimplesFrame({ pose, time, onDark = false }: { pose: Pose; time: number; onDark?: boolean }) {
  return (
    <svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx={60} cy={132} rx={34} ry={4} fill="#000" opacity={0.08} />
      <Figure pose={pose} rig={rigAt(pose, time)} limb={onDark ? "#efe9da" : INK} />
    </svg>
  );
}
