import type { SkillCategory, HandicapTier } from "./brand.js";

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
  caption?: string;
}
