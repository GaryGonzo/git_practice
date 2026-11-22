import type { SkillCategory, HandicapTier } from "./brand.js";
import type { ScoreDirection } from "./scoring.js";
import type { Aid, BandTargets, DrillKind, DrillLevel, Needs, Scene, Spot } from "./library.js";

export interface DrillTargets extends Record<HandicapTier, string> {}

export interface Drill {
  id: string;
  name: string;
  category: SkillCategory;
  weekVariant?: "A" | "B";
  setup: {
    equipment: string[];
    description: string;
  };
  rules: {
    description: string;
    scoring: string[];
  };
  targets: DrillTargets;
  /** Whether a higher score or a lower score (e.g. a stroke count) wins. Defaults to "higher" for almost every drill. */
  scoreDirection: ScoreDirection;
  caption?: string;
  /** Direct URL to an instructional video (mp4/webm). Undefined until the drill has one. */
  videoUrl?: string;
  /** The yardage this drill calls for, if it's yardage-based. Most drills don't set this. */
  targetYardage?: number;
  /** Golfable v2 session fields. Absent on v1-only rows. */
  status?: "active" | "archived";
  areas?: SkillCategory[];
  spots?: Spot[];
  needs?: Needs;
  aids?: Aid[];
  minutes?: number;
  /** False for rep drills (checked off, not scored) -- kept out of the Golfable Score. */
  scored?: boolean;
  repsLabel?: string;
  steps?: string[];
  scoreLabel?: string;
  bandTargets?: BandTargets;
  scene?: Scene;
  kind?: DrillKind;
  level?: DrillLevel;
}
