// Golfable v2 vocabulary: where a drill can be done, what it needs, and
// how its animated scene is drawn. Shared by the web app (session builder,
// drill screen) and the seed script that loads the drill library.

import type { SkillCategory } from "./brand.js";

/** The one remembered session answer. */
export const HANDICAP_BANDS = ["0-5", "6-10", "11-15", "16-20", "21+"] as const;
export type HandicapBand = (typeof HANDICAP_BANDS)[number];

export const BAND_LABEL: Record<HandicapBand, string> = {
  "0-5": "0–5",
  "6-10": "6–10",
  "11-15": "11–15",
  "16-20": "16–20",
  "21+": "21+",
};

/**
 * Spots inside a facility where a drill can happen.
 *  body   -- nothing needed, any space you can stand in
 *  floor  -- a flat floor or mat to putt on
 *  swing  -- room to swing a club, no ball
 *  basket -- chipping into a chipping net or basket
 *  net    -- full swings with balls into a hitting net / simulator
 *  range  -- a driving range
 *  green  -- a putting green
 *  chip   -- a chipping green or practice bunker
 */
export const SPOTS = ["body", "floor", "swing", "basket", "net", "range", "green", "chip"] as const;
export type Spot = (typeof SPOTS)[number];

/** What a drill needs you to have with you. */
export type Needs = "none" | "putter_ball" | "clubs" | "clubs_balls";

export const AIDS = [
  "sticks",
  "mirror",
  "putting_mat",
  "chipping_net",
  "impact_spray",
  "speed_trainer",
  "launch_monitor",
] as const;
export type Aid = (typeof AIDS)[number];

export const AID_LABEL: Record<Aid, string> = {
  sticks: "Alignment sticks",
  mirror: "Putting mirror",
  putting_mat: "Putting mat",
  chipping_net: "Chipping net or basket",
  impact_spray: "Impact spray or tape",
  speed_trainer: "Swing speed trainer",
  launch_monitor: "Launch monitor",
};

export type DrillKind = "warmup" | "skill" | "test";
export type DrillLevel = "all" | "foundation" | "advanced";

export type Pose = "putt" | "swing" | "chip" | "turn" | "hips" | "hinge" | "balance" | "think" | "finish" | "arms" | "grip" | "celebrate";

export type SceneSet = "room" | "green" | "range" | "chip" | "garage" | "net" | "body";

/** Scene coordinates are on a 100 x 60 grid; the renderer scales them. */
export type SceneItem =
  | { k: "cup" | "mug" | "coin" | "tee" | "ball" | "flag" | "mirror" | "basket" | "mark"; x: number; y: number; label?: string }
  | { k: "zone"; x: number; y: number; r: number; label?: string }
  | { k: "stick" | "line" | "towel" | "wall"; x: number; y: number; x2: number; y2: number; label?: string };

export interface SceneShot {
  from: [number, number];
  to: [number, number];
  /** Through the air (range shots) vs rolling along the ground (putts). */
  air?: boolean;
}

export interface Scene {
  set: SceneSet;
  pose: Pose;
  items?: SceneItem[];
  shots?: SceneShot[];
}

/** Targets per handicap band, in the drill's own score units. */
export type BandTargets = Record<HandicapBand, number>;

export interface LibraryDrill {
  id: string;
  name: string;
  /** Primary area -- where the score counts toward the Golfable Score. */
  category: SkillCategory;
  /** Every area the drill helps (session matching). */
  areas: SkillCategory[];
  spots: Spot[];
  needs: Needs;
  /** Aids the drill can't be done without. */
  aids?: Aid[];
  minutes: number;
  kind: DrillKind;
  level?: DrillLevel;
  /** What you need, as a short list shown on the drill. */
  equipment: string[];
  /** Plain, numbered directions. Three or four short lines. */
  steps: string[];
  /** Scored drills: what the number means, its max, direction, targets. */
  score?: { label: string; max: number; lower?: boolean; targets: BandTargets };
  /** Rep drills: the dose, e.g. "10 each way". */
  reps?: string;
  scene: Scene;
}

export function bandTargets(t: [number, number, number, number, number]): BandTargets {
  return { "0-5": t[0], "6-10": t[1], "11-15": t[2], "16-20": t[3], "21+": t[4] };
}
