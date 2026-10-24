// Weekly nutrition mini-goal -- pure math plus small localStorage helpers.
// Progress comes from the existing fit_daily_logs habits (water, protein
// hits, kitchen closed). Goal choice, Sunday prep and drink nights live in
// localStorage, so no database change is needed. Training streak math in
// fitStreaks.ts is untouched.
//
// Future migration (not written/applied): a fit_weekly_nutrition table
// (user_id, week_start, goal_id, hit boolean, drink_nights int, prep_done
// boolean) would sync these across devices and let the server count
// "weeks hit" toward the Golfable streak.
import type { FitDailyLog } from "./golfableApi";
import { nutritionPlan } from "../data/nutritionPlan";

export type MiniGoalId = "protein" | "kitchen" | "water" | "prep" | "drinks";

export interface MiniGoalDef {
  id: MiniGoalId;
  label: string;
  short: string;
  target: number;
  unit: string;
}

const t = nutritionPlan.targets;

export const MINI_GOALS: MiniGoalDef[] = [
  { id: "protein", label: `Protein hits ${t.protein_hits_per_day}/${t.protein_hits_per_day} on 5+ days`, short: "Protein hits", target: 5, unit: "days" },
  { id: "kitchen", label: "Kitchen closed by 8pm 5+ nights", short: "Kitchen closed", target: 5, unit: "nights" },
  { id: "water", label: `Water goal (${t.water_oz} oz) 5+ days`, short: "Water goal", target: 5, unit: "days" },
  { id: "prep", label: "Sunday prep done", short: "Sunday prep", target: 1, unit: "" },
  { id: "drinks", label: "Drinks only on one planned night (Friday)", short: "One drink night", target: 1, unit: "night max" },
];

// Rotation used when Gary hasn't picked -- deterministic by week so he
// never has to decide.
const ROTATION: MiniGoalId[] = ["protein", "kitchen", "water", "prep"];

export function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function mondayOf(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export function weekIndex(weekStart: string): number {
  return Math.round((Date.parse(`${weekStart}T00:00:00Z`) - Date.parse("2026-01-05T00:00:00Z")) / (7 * 864e5));
}

const KEY = "golfable.fit.nutrition";

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`${KEY}.${key}`);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(`${KEY}.${key}`, JSON.stringify(value));
  } catch {
    /* private mode -- fine */
  }
}
export const nutritionStore = { read: readLS, write: writeLS };

export function goalFor(weekStart: string): MiniGoalDef {
  const picked = readLS<MiniGoalId | null>(`goal.${weekStart}`, null);
  const id = picked ?? ROTATION[((weekIndex(weekStart) % ROTATION.length) + ROTATION.length) % ROTATION.length];
  return MINI_GOALS.find((g) => g.id === id)!;
}
export function pickGoal(weekStart: string, id: MiniGoalId) {
  writeLS(`goal.${weekStart}`, id);
}

export function prepDone(weekStart: string): boolean {
  // Prep is done when every step of the Sunday checklist is ticked, or
  // marked done in one tap.
  const checks = readLS<number[]>(`prep.${weekStart}`, []);
  return readLS<boolean>(`prepDone.${weekStart}`, false) || checks.length >= nutritionPlan.prep_day.steps.length;
}
export function drinkNights(weekStart: string): string[] {
  return readLS<string[]>(`drinks.${weekStart}`, []);
}

export interface GoalProgress {
  goal: MiniGoalDef;
  count: number;
  hit: boolean;
  // drinks: the week isn't settled until Sunday.
  settled: boolean;
  totals: { proteinDays: number; kitchenNights: number; waterDays: number; daysLogged: number };
}

export function weekProgress(weekStart: string, logs: FitDailyLog[], today: string, goal = goalFor(weekStart)): GoalProgress {
  const end = addDays(weekStart, 6);
  const inWeek = logs.filter((l) => l.logDate >= weekStart && l.logDate <= end);
  const totals = {
    proteinDays: inWeek.filter((l) => l.proteinHits >= t.protein_hits_per_day).length,
    kitchenNights: inWeek.filter((l) => l.kitchenClosedBy === true).length,
    waterDays: inWeek.filter((l) => l.waterOz >= t.water_oz).length,
    daysLogged: inWeek.length,
  };
  const settled = today > end || (today === end && goal.id !== "drinks");
  let count = 0;
  let hit = false;
  switch (goal.id) {
    case "protein":
      count = totals.proteinDays;
      hit = count >= goal.target;
      break;
    case "kitchen":
      count = totals.kitchenNights;
      hit = count >= goal.target;
      break;
    case "water":
      count = totals.waterDays;
      hit = count >= goal.target;
      break;
    case "prep":
      count = prepDone(weekStart) ? 1 : 0;
      hit = count >= 1;
      break;
    case "drinks":
      count = drinkNights(weekStart).length;
      hit = count <= 1 && today >= end;
      break;
  }
  return { goal, count, hit, settled, totals };
}

// Consecutive weeks the mini-goal was hit. This week counts once hit;
// an open week never breaks the run.
export function weeksHitStreak(logs: FitDailyLog[], today: string, maxWeeks = 26): number {
  const thisWeek = mondayOf(today);
  let n = weekProgress(thisWeek, logs, today).hit ? 1 : 0;
  for (let i = 1; i <= maxWeeks; i++) {
    const ws = addDays(thisWeek, -7 * i);
    if (!weekProgress(ws, logs, today).hit) break;
    n++;
  }
  return n;
}

export function harperSummary(weekStart: string, p: GoalProgress, streak: number): string {
  const end = addDays(weekStart, 6);
  const lines = [
    `Golfable Fit week ${weekStart} to ${end}`,
    `Mini-goal: ${p.goal.label} -> ${p.hit ? "HIT" : p.settled ? "missed" : "in progress"} (${p.count}${p.goal.id === "prep" ? "" : ` ${p.goal.unit}`})`,
    `Protein hits ${t.protein_hits_per_day}/${t.protein_hits_per_day}: ${p.totals.proteinDays}/7 days`,
    `Kitchen closed by 8pm: ${p.totals.kitchenNights}/7 nights`,
    `Water ${t.water_oz} oz: ${p.totals.waterDays}/7 days`,
    `Sunday prep: ${prepDone(weekStart) ? "done" : "not done"}`,
    `Drink nights: ${drinkNights(weekStart).length}`,
    `Mini-goal weeks hit in a row: ${streak}`,
    `Days logged: ${p.totals.daysLogged}/7`,
  ];
  return lines.join("\n");
}
