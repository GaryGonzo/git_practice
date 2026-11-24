// Everything Golfable works out from your logged scores: practice days and
// streaks, per-drill trends, your weakest area lately, badges, and friend
// challenge links. Pure functions over score history so they're easy to
// test and cost nothing to recompute.

import { SKILL_CATEGORIES, type Drill, type HandicapBand, type SkillCategory } from "@golfable/shared";
import { hitTarget, targetFor } from "./sessionBuilder";
import { weekStart } from "./fitConsistency";

export interface LoggedScore {
  date: string;
  createdAt: string;
  drill: Drill;
  score: number;
}

const byTime = (a: LoggedScore, b: LoggedScore) => a.createdAt.localeCompare(b.createdAt);

/** Days you practiced (any drill logged), oldest first. */
export function practiceDates(history: LoggedScore[]): string[] {
  return [...new Set(history.map((h) => h.date))].sort();
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Longest run of weeks in a row that hit the weekly goal. */
export function bestWeekStreak(dates: string[], goal: number): number {
  const perWeek = new Map<string, number>();
  for (const d of new Set(dates)) perWeek.set(weekStart(d), (perWeek.get(weekStart(d)) ?? 0) + 1);
  const weeks = [...perWeek.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const w of weeks) {
    if ((perWeek.get(w) ?? 0) < goal) {
      run = 0;
      prev = w;
      continue;
    }
    run = prev && addDays(prev, 7) === w && run > 0 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Trends

export interface Trend {
  scores: number[];
  first: number;
  last: number;
  best: number;
  /** Positive = getting better, whichever way the drill scores. */
  change: number;
}

/** Your recent scores on one drill, oldest first (up to `n`). */
export function drillTrend(history: LoggedScore[], drillId: string, n = 10): Trend | null {
  const rows = history.filter((h) => h.drill.id === drillId && h.drill.scored !== false).sort(byTime).slice(-n);
  if (rows.length === 0) return null;
  const lower = rows[0].drill.scoreDirection === "lower";
  const scores = rows.map((r) => r.score);
  const first = scores[0];
  const last = scores[scores.length - 1];
  return { scores, first, last, best: lower ? Math.min(...scores) : Math.max(...scores), change: lower ? first - last : last - first };
}

/** Every scored drill you've logged at least twice, most played first. */
export function allTrends(history: LoggedScore[]): { drill: Drill; trend: Trend; plays: number }[] {
  const plays = new Map<string, { drill: Drill; n: number }>();
  for (const h of history) {
    if (h.drill.scored === false) continue;
    const e = plays.get(h.drill.id) ?? { drill: h.drill, n: 0 };
    e.n++;
    plays.set(h.drill.id, e);
  }
  return [...plays.values()]
    .filter((e) => e.n >= 2)
    .sort((a, b) => b.n - a.n || a.drill.name.localeCompare(b.drill.name))
    .map((e) => ({ drill: e.drill, trend: drillTrend(history, e.drill.id)!, plays: e.n }));
}

// ---------------------------------------------------------------------------
// Smart next session

export interface WeakSpot {
  area: SkillCategory;
  hits: number;
  attempts: number;
  /** "misses": lowest hit rate lately. "neglected": least practiced. */
  reason: "misses" | "neglected";
}

/** The area to work on next, from the last 30 days of scored drills. */
export function weakestArea(history: LoggedScore[], band: HandicapBand, today: string): WeakSpot | null {
  const since = addDays(today, -30);
  const recent = history.filter((h) => h.date >= since);
  if (recent.length < 3) return null;

  const stats = new Map<SkillCategory, { hits: number; attempts: number; plays: number }>();
  for (const c of SKILL_CATEGORIES) stats.set(c, { hits: 0, attempts: 0, plays: 0 });
  for (const h of recent) {
    for (const area of h.drill.areas ?? [h.drill.category]) {
      const s = stats.get(area as SkillCategory);
      if (!s) continue;
      s.plays++;
      if (targetFor(h.drill, band)) {
        s.attempts++;
        if (hitTarget(h.drill, band, h.score)) s.hits++;
      }
    }
  }

  const scored = SKILL_CATEGORIES.map((c) => ({ area: c, ...stats.get(c)! })).filter((s) => s.attempts >= 2);
  if (scored.length > 0) {
    scored.sort((a, b) => a.hits / a.attempts - b.hits / b.attempts || a.attempts - b.attempts);
    const w = scored[0];
    // Hitting nearly everything? Then the gap is what you haven't practiced.
    if (w.hits / w.attempts < 0.75) return { area: w.area, hits: w.hits, attempts: w.attempts, reason: "misses" };
  }
  const least = SKILL_CATEGORIES.map((c) => ({ area: c, ...stats.get(c)! })).sort((a, b) => a.plays - b.plays)[0];
  return { area: least.area, hits: least.hits, attempts: least.attempts, reason: "neglected" };
}

// ---------------------------------------------------------------------------
// Badges

export type BadgeIcon = "flag" | "flame" | "star" | "compass" | "target" | "sun" | "moon" | "trophy" | "putter" | "calendar" | "ball";

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: BadgeIcon;
}

export interface Badge extends BadgeDef {
  earned: boolean;
  /** 0..1 toward earning it. */
  progress: number;
}

export const BADGES: BadgeDef[] = [
  { id: "first", name: "First Golfable", desc: "Log your first practice day.", icon: "flag" },
  { id: "days-10", name: "Regular", desc: "Practice on 10 different days.", icon: "calendar" },
  { id: "days-25", name: "Grinder", desc: "Practice on 25 different days.", icon: "calendar" },
  { id: "days-50", name: "Range Rat", desc: "Practice on 50 different days.", icon: "trophy" },
  { id: "streak-2", name: "On a Roll", desc: "Hit your weekly goal 2 weeks in a row.", icon: "flame" },
  { id: "streak-4", name: "Locked In", desc: "Hit your weekly goal 4 weeks in a row.", icon: "flame" },
  { id: "drills-10", name: "Explorer", desc: "Try 10 different drills.", icon: "compass" },
  { id: "drills-25", name: "Drill Collector", desc: "Try 25 different drills.", icon: "compass" },
  { id: "pb-1", name: "New Best", desc: "Beat your best on any drill.", icon: "star" },
  { id: "pb-10", name: "Best Yet", desc: "Set 10 personal bests.", icon: "star" },
  { id: "perfect", name: "Perfect Day", desc: "Hit every target in a day (3+ scored drills).", icon: "target" },
  { id: "all-rounder", name: "All-Rounder", desc: "Driver, irons, wedges and putting in one day.", icon: "ball" },
  { id: "putts-25", name: "Flat Stick", desc: "Log 25 putting drills.", icon: "putter" },
  { id: "early", name: "Early Bird", desc: "Practice before 7am.", icon: "sun" },
  { id: "late", name: "Night Owl", desc: "Practice after 9pm.", icon: "moon" },
];

/** How many personal bests you've set (beating your previous best on a drill). */
export function personalBestCount(history: LoggedScore[]): number {
  const best = new Map<string, number>();
  let count = 0;
  for (const h of [...history].sort(byTime)) {
    if (h.drill.scored === false) continue;
    const prev = best.get(h.drill.id);
    const lower = h.drill.scoreDirection === "lower";
    if (prev === undefined) best.set(h.drill.id, h.score);
    else if (lower ? h.score < prev : h.score > prev) {
      count++;
      best.set(h.drill.id, h.score);
    }
  }
  return count;
}

export function badges(history: LoggedScore[], band: HandicapBand, weeklyGoal: number): Badge[] {
  const dates = practiceDates(history);
  const days = dates.length;
  const streak = bestWeekStreak(dates, weeklyGoal);
  const drills = new Set(history.map((h) => h.drill.id)).size;
  const pbs = personalBestCount(history);
  const putts = history.filter((h) => h.drill.category === "putter").length;
  const hours = history.map((h) => new Date(h.createdAt).getHours());

  const perDay = new Map<string, LoggedScore[]>();
  for (const h of history) perDay.set(h.date, [...(perDay.get(h.date) ?? []), h]);
  let perfect = false;
  let allRound = false;
  for (const rows of perDay.values()) {
    const scored = rows.filter((r) => targetFor(r.drill, band));
    if (scored.length >= 3 && scored.every((r) => hitTarget(r.drill, band, r.score))) perfect = true;
    const cats = new Set(rows.map((r) => r.drill.category));
    if (SKILL_CATEGORIES.every((c) => cats.has(c))) allRound = true;
  }

  const ratio = (have: number, need: number) => Math.min(1, have / need);
  const progress: Record<string, number> = {
    first: ratio(days, 1),
    "days-10": ratio(days, 10),
    "days-25": ratio(days, 25),
    "days-50": ratio(days, 50),
    "streak-2": ratio(streak, 2),
    "streak-4": ratio(streak, 4),
    "drills-10": ratio(drills, 10),
    "drills-25": ratio(drills, 25),
    "pb-1": ratio(pbs, 1),
    "pb-10": ratio(pbs, 10),
    perfect: perfect ? 1 : 0,
    "all-rounder": allRound ? 1 : 0,
    "putts-25": ratio(putts, 25),
    early: hours.some((h) => h < 7) ? 1 : 0,
    late: hours.some((h) => h >= 21) ? 1 : 0,
  };
  return BADGES.map((b) => ({ ...b, progress: progress[b.id] ?? 0, earned: (progress[b.id] ?? 0) >= 1 }));
}

const SEEN_KEY = "golfable.badgesSeen";

/** Badges earned that haven't been shown yet; marks them shown. */
export function takeNewBadges(all: Badge[]): Badge[] {
  let seen: string[] | null = null;
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "null");
  } catch {
    seen = null;
  }
  const earned = all.filter((b) => b.earned);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(earned.map((b) => b.id)));
  } catch {
    // Private mode.
  }
  // First time on this phone: don't throw a pile of old badges at you.
  if (seen === null) return [];
  return earned.filter((b) => !seen!.includes(b.id));
}

// ---------------------------------------------------------------------------
// Friend challenges

export interface Challenge {
  drillId: string;
  score: number;
  from: string;
}

export function challengeUrl(c: Challenge, origin = "https://golfable.co"): string {
  const q = new URLSearchParams({ d: c.drillId, s: String(c.score), n: c.from });
  return `${origin}/challenge?${q.toString()}`;
}

export function parseChallenge(search: string): Challenge | null {
  const q = new URLSearchParams(search);
  const drillId = q.get("d");
  const score = Number(q.get("s"));
  if (!drillId || !/^[a-z0-9-]{1,60}$/.test(drillId) || !Number.isFinite(score) || score < 0 || score > 999) return null;
  const from = (q.get("n") ?? "A friend").replace(/[^\p{L}\p{N} .'-]/gu, "").slice(0, 30) || "A friend";
  return { drillId, score: Math.round(score), from };
}

/** Did `score` beat the challenge? Ties don't count. */
export function beatsChallenge(drill: Drill, score: number, toBeat: number): boolean {
  return drill.scoreDirection === "lower" ? score < toBeat : score > toBeat;
}

const PENDING_KEY = "golfable.pendingChallenge";

export function savePendingChallenge(c: Challenge | null) {
  try {
    if (c) localStorage.setItem(PENDING_KEY, JSON.stringify(c));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // Private mode.
  }
}

export function loadPendingChallenge(): Challenge | null {
  try {
    const c = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "null") as Challenge | null;
    return c && typeof c.drillId === "string" && typeof c.score === "number" ? c : null;
  } catch {
    return null;
  }
}
