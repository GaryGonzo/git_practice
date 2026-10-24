// Harper's nutrition plan for Golfable Fit, as static read-only data.
// Harper owns the numbers; the app only shows them and tracks habits.
// Source: Harper's plan.json (photos converted to webp in /public/nutrition).
import raw from "./nutritionPlan.json";

export interface NutritionMeal {
  id: string;
  name: string;
  slot: string;
  days: string[];
  kcal: number;
  protein_g: number;
  servings?: number;
  photo: string;
  ingredients: string[];
  steps: string[];
}

export interface Mocktail {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  kcal_approx: number;
  tags: string[];
  photo: string;
}

export interface NutritionPlan {
  for: string;
  author: string;
  targets: {
    note: string;
    block: string;
    daily: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
    deload: { week: number; dates: string; kcal: number; note: string };
    water_oz: number;
    protein_hits_per_day: number;
    protein_hit_g: string;
    kitchen_closed: string;
    weekly_mini_goals: string[];
    streak_targets_days: number[];
    weigh_ins: string;
  };
  schedule: Record<string, string>;
  daily_totals_approx: string;
  meals: NutritionMeal[];
  week_menu: Record<string, string[]>;
  shopping_list: { store: string; week_of: string; sections: Record<string, string[]>; on_hand: string[] };
  prep_day: { day: string; hands_on_min: number; steps: string[] };
  mocktails: { notes: string; recipes: Mocktail[] };
}

export const nutritionPlan = raw as NutritionPlan;

export function mealById(id: string): NutritionMeal | undefined {
  // week_menu entries can carry a note, e.g. "sheet-pan-chicken-dinner (leftovers)".
  const clean = id.replace(/\s*\(.*\)\s*$/, "");
  return nutritionPlan.meals.find((m) => m.id === clean);
}

export function isLemonForward(m: Mocktail): boolean {
  return m.tags.includes("lemon");
}
