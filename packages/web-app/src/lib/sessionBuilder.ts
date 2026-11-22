// Golfable v2 session builder: a few quick answers -> a practice plan.
//
// "Where" is the facility you're at. Each area you pick is sent to the
// right spot inside it (irons on the range, putting on the practice green
// if there is one). Drills only show up if they work at a spot you have,
// with the gear and aids you have. The plan is a warm-up, then each area's
// drills, ending on a scored test where one fits, grouped by spot so you
// never walk back and forth.

import type { Aid, Drill, HandicapBand, LibraryDrill, Needs, SkillCategory, Spot } from "@golfable/shared";
import { AIDS, SKILL_CATEGORIES } from "@golfable/shared";

export type Place = "home" | "garage" | "net" | "range" | "green" | "other";
export type Gear = "clubs_balls" | "clubs" | "putter_ball" | "none";
export type Extra = "range" | "green" | "chip";
export type TimeBucket = 15 | 30 | 45 | 60;

export interface SessionAnswers {
  areas: SkillCategory[];
  time: TimeBucket;
  place: Place;
  /** Follow-up: what else is at this facility. */
  extras: Extra[];
  /** Only asked at home, garage/backyard or somewhere else. */
  gear: Gear;
  aids: Aid[];
  band: HandicapBand;
}

export const PLACE_OPTIONS: { value: Place; label: string; sub: string }[] = [
  { value: "home", label: "Home or office", sub: "Indoors, not much room" },
  { value: "garage", label: "Garage or backyard", sub: "Room to swing" },
  { value: "net", label: "Hitting net or simulator", sub: "Full swings with balls" },
  { value: "range", label: "Driving range", sub: "" },
  { value: "green", label: "Putting green", sub: "" },
  { value: "other", label: "Somewhere else", sub: "" },
];

export const TIME_OPTIONS: { value: TimeBucket; label: string }[] = [
  { value: 15, label: "Up to 15 min" },
  { value: 30, label: "15–30 min" },
  { value: 45, label: "30–45 min" },
  { value: 60, label: "Up to 60 min" },
];

export const GEAR_OPTIONS: { value: Gear; label: string }[] = [
  { value: "clubs_balls", label: "Clubs and balls" },
  { value: "clubs", label: "Clubs, no balls" },
  { value: "putter_ball", label: "Just a putter and a ball" },
  { value: "none", label: "Nothing" },
];

const TARGET_MINUTES: Record<TimeBucket, number> = { 15: 14, 30: 28, 45: 42, 60: 57 };

/** The gear question only matters where the answer isn't obvious. */
export function needsGearQuestion(place: Place): boolean {
  return place === "home" || place === "garage" || place === "other";
}

/** The follow-up "what else is there?" options, or none when it isn't needed. */
export function extraOptions(place: Place, areas: SkillCategory[]): { value: Extra; label: string }[] {
  const has = (a: SkillCategory) => areas.includes(a);
  if (place === "range" && (has("putter") || has("wedges"))) {
    const opts: { value: Extra; label: string }[] = [];
    if (has("putter") || has("wedges")) opts.push({ value: "green", label: "A practice putting green" });
    if (has("wedges")) opts.push({ value: "chip", label: "A chipping area or bunker" });
    return opts;
  }
  if (place === "green" && (has("driver") || has("irons") || has("wedges"))) {
    const opts: { value: Extra; label: string }[] = [];
    if (has("driver") || has("irons") || has("wedges")) opts.push({ value: "range", label: "A driving range" });
    if (has("wedges")) opts.push({ value: "chip", label: "A chipping area or bunker" });
    return opts;
  }
  return [];
}

function haveGear(a: Pick<SessionAnswers, "place" | "gear" | "extras">): Gear {
  if (a.place === "range" || a.place === "net") return "clubs_balls";
  if (a.place === "green") return a.extras.includes("range") || a.extras.includes("chip") ? "clubs_balls" : "putter_ball";
  return a.gear;
}

export function needsMet(needs: Needs | undefined, have: Gear): boolean {
  switch (needs ?? "none") {
    case "none":
      return true;
    case "putter_ball":
      return have === "putter_ball" || have === "clubs_balls";
    case "clubs":
      return have === "clubs" || have === "clubs_balls";
    case "clubs_balls":
      return have === "clubs_balls";
  }
}

/** Every spot available at this facility with this gear. */
export function availableSpots(a: Pick<SessionAnswers, "place" | "gear" | "extras" | "aids">): Set<Spot> {
  const have = haveGear(a);
  const ball = have === "putter_ball" || have === "clubs_balls";
  const clubs = have === "clubs" || have === "clubs_balls";
  const s = new Set<Spot>(["body"]);
  switch (a.place) {
    case "home":
      if (ball) s.add("floor");
      if (have === "clubs_balls" && a.aids.includes("chipping_net")) s.add("basket");
      break;
    case "garage":
    case "other":
      if (ball) s.add("floor");
      if (clubs) s.add("swing");
      if (have === "clubs_balls" && a.aids.includes("chipping_net")) s.add("basket");
      break;
    case "net":
      s.add("floor");
      s.add("swing");
      s.add("net");
      if (a.aids.includes("chipping_net")) s.add("basket");
      break;
    case "range":
      s.add("swing");
      s.add("range");
      if (a.extras.includes("green")) s.add("green");
      if (a.extras.includes("chip")) s.add("chip");
      break;
    case "green":
      s.add("green");
      if (a.extras.includes("range")) {
        s.add("range");
        s.add("swing");
      }
      if (a.extras.includes("chip")) s.add("chip");
      break;
  }
  return s;
}

function fits(d: Drill, spots: Set<Spot>, have: Gear, aids: Aid[], band: HandicapBand): boolean {
  if (d.status === "archived") return false;
  if (!(d.spots ?? []).some((s) => spots.has(s))) return false;
  if (!needsMet(d.needs, have)) return false;
  if (!(d.aids ?? []).every((x) => aids.includes(x))) return false;
  if (d.level === "advanced" && band !== "0-5" && band !== "6-10") return false;
  return true;
}

/** Aids worth asking about: only those that would unlock a drill for these areas, here. */
export function relevantAids(drills: Drill[], a: Pick<SessionAnswers, "areas" | "place" | "gear" | "extras">): Aid[] {
  const all = [...AIDS];
  const spots = availableSpots({ ...a, aids: all });
  const have = haveGear(a);
  return all.filter((aid) =>
    drills.some(
      (d) =>
        (d.aids ?? []).includes(aid) &&
        (d.areas ?? [d.category]).some((x) => a.areas.includes(x)) &&
        fits(d, spots, have, all, "0-5")
    )
  );
}

// ---------------------------------------------------------------------------

export type Zone = "range" | "chip" | "green";

export type SessionStep =
  | { type: "drill"; drillId: string; area: SkillCategory | "warmup"; minutes: number; spot: Spot }
  | { type: "move"; to: Zone; label: string };

export interface PracticePlan {
  date: string;
  answers: SessionAnswers;
  steps: SessionStep[];
  estimatedMinutes: number;
}

type Rand = () => number;

function shuffle<T>(items: T[], rand: Rand): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Walking order: hit balls first, then short game, then the green.
const SPOT_ORDER: Spot[] = ["body", "swing", "range", "net", "basket", "chip", "green", "floor"];

function zoneOf(spot: Spot, place: Place): Zone | null {
  if (place !== "range" && place !== "green") return null;
  if (spot === "range" || spot === "swing") return "range";
  if (spot === "chip") return "chip";
  if (spot === "green" || spot === "floor") return "green";
  return null;
}

const ZONE_RANK: Record<Zone, number> = { range: 0, chip: 1, green: 2 };

const MOVE_LABEL: Record<Zone, string> = {
  range: "Head to the range",
  chip: "Head to the chipping area",
  green: "Head to the putting green",
};

/** The best spot for this drill among those available (most specific first). */
function bestSpot(d: Drill, spots: Set<Spot>): Spot {
  const order: Spot[] = ["range", "net", "chip", "green", "basket", "swing", "floor", "body"];
  return order.find((s) => (d.spots ?? []).includes(s) && spots.has(s)) ?? "body";
}

export function buildPlan(
  library: Drill[],
  answers: SessionAnswers,
  date: string,
  recentDrillIds: Set<string> = new Set(),
  rand: Rand = Math.random
): PracticePlan {
  const areas = answers.areas.length > 0 ? answers.areas : [...SKILL_CATEGORIES];
  const spots = availableSpots(answers);
  const have = haveGear(answers);
  const pool = library.filter((d) => fits(d, spots, have, answers.aids, answers.band));
  const used = new Set<string>();

  // Ranking: fresh before recently played, hitting real balls before
  // rehearsal, and drills built for this area before all-purpose ones.
  const spotCost = (d: Drill) => {
    const s = bestSpot(d, spots);
    if (s === "body") return 2;
    if (s === "swing" || s === "floor") return 1;
    // Carpet drills work on a real green, but green drills come first there.
    if (s === "green" && (d.spots ?? []).includes("floor")) return 1;
    return 0;
  };
  const rank = (ds: Drill[], area?: SkillCategory) => {
    const shuffled = shuffle(ds, rand);
    const score = (d: Drill) =>
      (recentDrillIds.has(d.id) ? 6 : 0) + spotCost(d) * 2 + (area && d.category !== area && (d.areas ?? []).length > 2 ? 1 : 0);
    return shuffled.sort((x, y) => score(x) - score(y));
  };

  // Walking between the range, chipping area and green takes a couple of minutes each.
  const walking = answers.place === "range" || answers.place === "green" ? answers.extras.length * 2 : 0;
  const target = TARGET_MINUTES[answers.time] - walking;
  const picked: { drill: Drill; area: SkillCategory | "warmup"; spot: Spot }[] = [];

  // Warm-up: one short drill that helps something you picked -- skipped
  // when the time is too tight to give every area a real drill.
  const tight = target / areas.length < 6;
  const warmups = rank(pool.filter((d) => d.kind === "warmup" && (d.areas ?? []).some((x) => areas.includes(x))));
  if (warmups[0] && !tight) {
    picked.push({ drill: warmups[0], area: "warmup", spot: bestSpot(warmups[0], spots) });
    used.add(warmups[0].id);
  }
  const warmupMinutes = picked.reduce((m, p) => m + (p.drill.minutes ?? 5), 0);
  const share = Math.max(4, (target - warmupMinutes) / areas.length);

  for (const area of areas) {
    const forArea = pool.filter((d) => d.kind !== "warmup" && (d.areas ?? [d.category]).includes(area));
    const tests = rank(forArea.filter((d) => d.kind === "test" && d.scored !== false), area);
    const ranked = rank(forArea.filter((d) => d.kind !== "test"), area);
    // Short on time: the quickest drills first so every area still fits.
    const skills = tight ? [...ranked].sort((x, y) => (x.minutes ?? 8) - (y.minutes ?? 8)) : ranked;
    const chosen: Drill[] = [];
    let mins = 0;
    const take = (d: Drill) => {
      chosen.push(d);
      used.add(d.id);
      mins += d.minutes ?? 8;
    };
    const fitsLeft = (d: Drill, slack: number) => mins + (d.minutes ?? 8) <= share + slack;

    // 1. The area's best drill. 2. A scored test to finish, if it fits.
    // 3. Fill what's left.
    const first = skills.find((d) => !used.has(d.id) && fitsLeft(d, 1));
    if (first) take(first);
    const test = tests.find((d) => !used.has(d.id) && fitsLeft(d, 2));
    if (test) take(test);
    for (const d of skills) {
      if (mins >= share - 2) break;
      if (!used.has(d.id) && fitsLeft(d, 1)) take(d);
    }
    // Never leave an area empty: take the shortest thing that fits it.
    if (chosen.length === 0) {
      const fallback = [...skills, ...tests].filter((d) => !used.has(d.id)).sort((x, y) => (x.minutes ?? 8) - (y.minutes ?? 8))[0];
      if (fallback) {
        chosen.push(fallback);
        used.add(fallback.id);
      }
    }
    // Within an area: skills by spot, the test last.
    chosen
      .sort((x, y) => {
        const tx = x.kind === "test" ? 1 : 0;
        const ty = y.kind === "test" ? 1 : 0;
        if (tx !== ty) return tx - ty;
        return SPOT_ORDER.indexOf(bestSpot(x, spots)) - SPOT_ORDER.indexOf(bestSpot(y, spots));
      })
      .forEach((d) => picked.push({ drill: d, area, spot: bestSpot(d, spots) }));
  }

  // Group areas by where they happen so you walk once: warm-up, then areas
  // in the walking order of their main spot.
  const warm = picked.filter((p) => p.area === "warmup");
  const byArea = areas
    .map((area) => picked.filter((p) => p.area === area))
    .filter((list) => list.length > 0)
    .sort((x, y) => {
      // An area sits where its farthest drill is (range -> chipping -> green),
      // so the walk only ever goes one way.
      const far = (list: typeof x) => Math.max(...list.map((p) => ZONE_RANK[zoneOf(p.spot, answers.place) ?? "range"] + (p.spot === "body" ? -1 : 0)), -1);
      const near = (list: typeof x) => Math.min(...list.filter((p) => p.spot !== "body").map((p) => SPOT_ORDER.indexOf(p.spot)), 99);
      return far(x) - far(y) || near(x) - near(y);
    });

  const steps: SessionStep[] = [];
  let zone: Zone | null = null;
  for (const p of [...warm, ...byArea.flat()]) {
    const z = zoneOf(p.spot, answers.place);
    // Body drills happen wherever you're standing -- no move needed.
    if (z && p.spot !== "body" && z !== zone) {
      // The first zone at your own facility needs no "head to" step.
      const home: Zone | null = answers.place === "range" ? "range" : answers.place === "green" ? "green" : null;
      if (zone !== null || z !== home) steps.push({ type: "move", to: z, label: MOVE_LABEL[z] });
      zone = z;
    }
    steps.push({ type: "drill", drillId: p.drill.id, area: p.area, minutes: p.drill.minutes ?? 8, spot: p.spot });
  }

  const estimatedMinutes = steps.reduce((m, s) => m + (s.type === "drill" ? s.minutes : 2), 0);
  return { date, answers: { ...answers, areas }, steps, estimatedMinutes };
}

/** A library entry as a Drill, for tests and as an offline fallback. */
export function drillFromLibrary(d: LibraryDrill): Drill {
  const s = d.score;
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    setup: { equipment: d.equipment, description: d.steps[0] },
    rules: { description: d.steps.slice(1).join(" "), scoring: s ? [s.label] : [] },
    targets: s
      ? { scratch: String(s.targets["0-5"]), low: String(s.targets["6-10"]), mid: String(s.targets["11-15"]), high: String(s.targets["21+"]) }
      : { scratch: "Done", low: "Done", mid: "Done", high: "Done" },
    scoreDirection: s?.lower ? "lower" : "higher",
    status: "active",
    areas: d.areas,
    spots: d.spots,
    needs: d.needs,
    aids: d.aids ?? [],
    minutes: d.minutes,
    scored: Boolean(s),
    repsLabel: d.reps,
    steps: d.steps,
    scoreLabel: s?.label,
    bandTargets: s?.targets,
    scene: d.scene,
    kind: d.kind,
    level: d.level ?? "all",
  };
}

export function maxScoreOf(d: Drill, fallback: number): number {
  return d.scored === false ? 1 : fallback;
}
