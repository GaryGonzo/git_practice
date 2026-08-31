import type { SkillCategory, HandicapTier } from "./brand.js";
import type { ScoreDirection } from "./scoring.js";

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
}
