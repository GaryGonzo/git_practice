// Golfable Fit: one button, one routine for today.
//
// Every exercise here is low impact -- core, glutes and the shoulder
// complex -- so the same moves can come back 3-4 times a week. Variety
// comes from mixing which ones show up, which variation, and small
// twists like a hold on the last rep or a slow lowering.
//
// Knee: left meniscus is touchy -- no jumping, no deep knee bends.
// Wrist: still healing, so planks default to forearms.

export type Group = "glutes" | "core" | "shoulders";

type Dose =
  | { kind: "reps"; min: number; max: number; step?: number }
  | { kind: "hold"; min: number; max: number } // seconds
  | { kind: "steps"; min: number; max: number }; // steps each direction

interface Exercise {
  name: string;
  group: Group;
  dose: Dose;
  perSide?: boolean;
  /** A hold on the last rep makes sense (bridges, bird dogs, raises). */
  canHoldLastRep?: boolean;
  /** A slow 3-second lowering makes sense. */
  canTempo?: boolean;
  variations?: Variation[];
  cue: string;
  caution?: string;
}

/** A variation can change the dose (side plank hip dips are reps, not a hold). */
interface Variation {
  label: string;
  dose?: Dose;
  perSide?: boolean;
}

export const LIBRARY: Exercise[] = [
  // ---------------- Glutes ----------------
  {
    name: "Glute bridge",
    group: "glutes",
    dose: { kind: "reps", min: 10, max: 15 },
    canHoldLastRep: true,
    canTempo: true,
    variations: [{ label: "Bodyweight" }, { label: "Band above knees" }, { label: "Marching", dose: { kind: "reps", min: 8, max: 12 }, perSide: true }],
    cue: "Squeeze glutes to lift, ribs down. Stop when hips line up with knees -- don't arch the low back.",
  },
  {
    name: "Single-leg glute bridge",
    group: "glutes",
    dose: { kind: "reps", min: 8, max: 12 },
    perSide: true,
    canHoldLastRep: true,
    cue: "Hug the free knee in or hold it bent at 90°. Hips stay level the whole way.",
  },
  {
    name: "Hip thrust",
    group: "glutes",
    dose: { kind: "reps", min: 10, max: 15 },
    canHoldLastRep: true,
    canTempo: true,
    variations: [{ label: "Upper back on couch" }, { label: "Band above knees" }],
    cue: "Chin tucked, shins vertical at the top. Drive through the heels.",
  },
  {
    name: "Fire hydrant",
    group: "glutes",
    dose: { kind: "reps", min: 10, max: 15 },
    perSide: true,
    canHoldLastRep: true,
    variations: [{ label: "Bodyweight" }, { label: "Band above knees" }],
    cue: "Hands under shoulders, knees under hips. Lift the knee out without leaning the torso.",
  },
  {
    name: "Clamshell",
    group: "glutes",
    dose: { kind: "reps", min: 12, max: 20 },
    perSide: true,
    canHoldLastRep: true,
    variations: [{ label: "Bodyweight" }, { label: "Band above knees" }],
    cue: "Heels together, hips stacked. Open from the hip -- don't roll back.",
  },
  {
    name: "Lateral squat walk",
    group: "glutes",
    dose: { kind: "steps", min: 10, max: 15 },
    variations: [{ label: "Band above knees" }, { label: "Band at ankles" }],
    cue: "Quarter squat, chest up, toes forward. Push the knees out against the band.",
    caution: "Keep the squat shallow for the knee.",
  },
  {
    name: "Side-lying hip abduction",
    group: "glutes",
    dose: { kind: "reps", min: 12, max: 15 },
    perSide: true,
    canHoldLastRep: true,
    canTempo: true,
    cue: "Top leg slightly behind you, toe pointing forward. Lift from the side of the hip.",
  },
  {
    name: "Donkey kick",
    group: "glutes",
    dose: { kind: "reps", min: 10, max: 15 },
    perSide: true,
    canHoldLastRep: true,
    variations: [{ label: "Bodyweight" }, { label: "Band around feet" }],
    cue: "Knee bent at 90°, press the heel to the ceiling. Low back stays flat.",
  },
  {
    name: "90/90 hip lift-off",
    group: "glutes",
    dose: { kind: "reps", min: 6, max: 10 },
    perSide: true,
    canHoldLastRep: true,
    cue: "Sit tall in 90/90, lift the back knee and foot an inch. Small movement, hard squeeze.",
  },
  {
    name: "Single-leg RDL",
    group: "glutes",
    dose: { kind: "reps", min: 6, max: 10 },
    perSide: true,
    canTempo: true,
    variations: [{ label: "Bodyweight" }, { label: "Fingertips on a wall" }],
    cue: "Soft knee, hinge at the hip, back leg long. Hips stay square to the floor.",
    caution: "Skip today if the knee complains.",
  },

  // ---------------- Core ----------------
  {
    name: "Bird dog",
    group: "core",
    dose: { kind: "reps", min: 6, max: 10 },
    perSide: true,
    canHoldLastRep: true,
    cue: "Reach long, not high. Back stays flat enough to hold a cup of water.",
  },
  {
    name: "Dead bug",
    group: "core",
    dose: { kind: "reps", min: 6, max: 10 },
    perSide: true,
    canTempo: true,
    variations: [{ label: "Classic" }, { label: "Holding a band overhead" }, { label: "Legs only" }],
    cue: "Low back pressed into the floor the whole time. Exhale as you reach.",
  },
  {
    name: "Plank",
    group: "core",
    dose: { kind: "hold", min: 30, max: 45 },
    variations: [
      { label: "Forearms" },
      { label: "RKC (max tension)", dose: { kind: "hold", min: 15, max: 25 } },
      { label: "Alternating leg lift", dose: { kind: "reps", min: 6, max: 10 }, perSide: true },
    ],
    cue: "Squeeze glutes and quads, pull elbows toward toes. Straight line, no sag.",
  },
  {
    name: "Side plank",
    group: "core",
    dose: { kind: "hold", min: 20, max: 40 },
    perSide: true,
    variations: [
      { label: "From knees" },
      { label: "From heels" },
      { label: "From knee + band, top leg lifted", dose: { kind: "hold", min: 15, max: 30 } },
      { label: "Hip dips", dose: { kind: "reps", min: 8, max: 12 } },
      { label: "Reach-through", dose: { kind: "reps", min: 6, max: 10 } },
      { label: "Top-leg raise", dose: { kind: "reps", min: 8, max: 12 } },
    ],
    cue: "Elbow under shoulder, hips pushed forward. Body in one line.",
  },
  {
    name: "Hollow body hold",
    group: "core",
    dose: { kind: "hold", min: 15, max: 30 },
    variations: [{ label: "Tucked knees" }, { label: "Arms by sides" }, { label: "Arms overhead" }],
    cue: "Low back glued to the floor. If it lifts, bend the knees more.",
  },
  {
    name: "Scissor kicks",
    group: "core",
    dose: { kind: "hold", min: 20, max: 30 },
    cue: "Hands under hips, low back down. Small, controlled crosses.",
  },
  {
    name: "Flutter kicks",
    group: "core",
    dose: { kind: "hold", min: 20, max: 30 },
    cue: "Legs low, back flat. Short, quick kicks from the hip.",
  },
  {
    name: "Heel taps (penguins)",
    group: "core",
    dose: { kind: "reps", min: 12, max: 20 },
    perSide: true,
    cue: "Shoulders slightly off the floor, side-bend to tap each heel.",
  },
  {
    name: "Pallof hold",
    group: "core",
    dose: { kind: "hold", min: 20, max: 30 },
    perSide: true,
    variations: [{ label: "Standing" }, { label: "Half-kneeling" }, { label: "Tall-kneeling" }],
    cue: "Arms locked out in front of your chest. Don't let the band turn you.",
  },
  {
    name: "Pallof press with rotation",
    group: "core",
    dose: { kind: "reps", min: 8, max: 10 },
    perSide: true,
    canHoldLastRep: true,
    variations: [{ label: "Standing" }, { label: "Half-kneeling" }],
    cue: "Press out, turn away from the anchor with the chest, hips stay quiet.",
  },
  {
    name: "Bear hold",
    group: "core",
    dose: { kind: "hold", min: 20, max: 40 },
    variations: [{ label: "Static" }, { label: "Shoulder taps", dose: { kind: "reps", min: 8, max: 12 }, perSide: true }],
    cue: "Knees an inch off the floor, back flat. Breathe.",
    caution: "Make fists if the wrist is cranky.",
  },
  {
    name: "Suitcase carry",
    group: "core",
    dose: { kind: "hold", min: 30, max: 45 },
    perSide: true,
    cue: "Weight in one hand, walk tall. Don't lean toward or away from it.",
  },
  {
    name: "Half-kneeling band chop",
    group: "core",
    dose: { kind: "reps", min: 8, max: 12 },
    perSide: true,
    canTempo: true,
    cue: "Anchor high, pull down and across past the far hip. Turn from the chest.",
  },
  {
    name: "Half-kneeling band lift",
    group: "core",
    dose: { kind: "reps", min: 8, max: 12 },
    perSide: true,
    canTempo: true,
    cue: "Anchor low, pull up and across. Hips stay square, glute of the down knee on.",
  },

  // ---------------- Shoulder complex ----------------
  {
    name: "WITY",
    group: "shoulders",
    dose: { kind: "reps", min: 5, max: 8 },
    canHoldLastRep: true,
    variations: [{ label: "Face down on the floor" }, { label: "Bent over, standing" }],
    cue: "Reps of each letter. Thumbs up, shoulder blades down and back. No shrugging.",
  },
  {
    name: "Band pull-apart",
    group: "shoulders",
    dose: { kind: "reps", min: 12, max: 20 },
    canHoldLastRep: true,
    variations: [{ label: "Palms down" }, { label: "Palms up" }, { label: "Diagonal" }],
    cue: "Arms straight, pull the band to your chest. Ribs down.",
  },
  {
    name: "Band face pull",
    group: "shoulders",
    dose: { kind: "reps", min: 12, max: 15 },
    canHoldLastRep: true,
    cue: "Pull to the eyes, elbows high, finish with thumbs pointing back.",
  },
  {
    name: "Band external rotation",
    group: "shoulders",
    dose: { kind: "reps", min: 10, max: 15 },
    perSide: true,
    canTempo: true,
    variations: [{ label: "Elbow at side" }, { label: "Elbow at 90/90" }],
    cue: "Towel between elbow and ribs. Rotate out slowly, don't let the elbow drift.",
  },
  {
    name: "Scap push-up",
    group: "shoulders",
    dose: { kind: "reps", min: 10, max: 15 },
    variations: [{ label: "On knees" }, { label: "Full plank" }, { label: "Hands on a counter" }],
    cue: "Arms stay straight. Let the chest sink, then push the floor away.",
    caution: "Counter version if the wrist is cranky.",
  },
  {
    name: "Wall slide",
    group: "shoulders",
    dose: { kind: "reps", min: 8, max: 12 },
    canTempo: true,
    cue: "Forearms on the wall, slide up while keeping ribs down. Small lift-off at the top.",
  },
  {
    name: "Open book",
    group: "shoulders",
    dose: { kind: "reps", min: 6, max: 10 },
    perSide: true,
    canHoldLastRep: true,
    cue: "Side-lying, knees stacked. Rotate the top arm open with your eyes following.",
  },
  {
    name: "Half Turkish get-up",
    group: "shoulders",
    dose: { kind: "reps", min: 3, max: 5 },
    perSide: true,
    canTempo: true,
    cue: "Light weight or a shoe on your fist. Eyes on it, arm locked, slow.",
  },
];

export interface RoutineItem {
  id: string;
  name: string;
  group: Group;
  variation: string | null;
  sets: number;
  /** "12 reps/side", "30 sec", "12 steps each way". */
  dose: string;
  /** Extra twist, e.g. "+ 10 sec hold on the last rep". */
  note: string | null;
  cue: string;
  caution: string | null;
  seconds: number;
}

export interface Routine {
  date: string;
  minutes: number;
  items: RoutineItem[];
  estimatedMinutes: number;
}

export const GROUP_LABEL: Record<Group, string> = {
  glutes: "Glutes",
  core: "Core",
  shoulders: "Shoulders",
};

// Order on screen: wake the glutes and shoulders up first, core last so
// the stabilizers aren't tired for everything else.
export const GROUP_ORDER: Group[] = ["glutes", "shoulders", "core"];

const SHARE: Record<Group, number> = { glutes: 0.35, core: 0.4, shoulders: 0.25 };
const REST_SEC = 30;
const TRANSITION_SEC = 30;

type Rand = () => number;

function pick<T>(arr: T[], rand: Rand): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickInRange(min: number, max: number, step: number, rand: Rand): number {
  const options: number[] = [];
  for (let v = min; v <= max; v += step) options.push(v);
  return pick(options, rand);
}

function buildItem(ex: Exercise, sets: number, rand: Rand, index: number): RoutineItem {
  const variation = ex.variations && ex.variations.length > 0 ? pick(ex.variations, rand) : null;
  const dose = variation?.dose ?? ex.dose;
  const perSide = variation?.perSide ?? ex.perSide ?? false;
  const sides = perSide ? 2 : 1;
  const side = perSide ? "/side" : "";

  let doseText: string;
  let workSec: number;
  let note: string | null = null;

  if (dose.kind === "hold") {
    const sec = pickInRange(dose.min, dose.max, 5, rand);
    doseText = `${sec} sec${side}`;
    workSec = sec * sides;
  } else if (dose.kind === "steps") {
    const steps = pickInRange(dose.min, dose.max, 1, rand);
    doseText = `${steps} steps each way`;
    workSec = steps * 2 * 2;
  } else {
    const step = dose.step ?? (dose.max - dose.min >= 4 ? 2 : 1);
    let reps = pickInRange(dose.min, dose.max, step, rand);
    const twist = rand();
    // Only rep-based work gets twists, and only the reps-based dose of
    // this exercise (a variation that swaps a hold for reps keeps it plain).
    const usesBaseDose = !variation?.dose;
    if (usesBaseDose && ex.canHoldLastRep && twist < 0.35) {
      const hold = pick([5, 10], rand);
      note = `+ ${hold} sec hold on the last rep`;
    } else if (usesBaseDose && ex.canTempo && twist >= 0.35 && twist < 0.55) {
      note = "3-second lowering on every rep";
      reps = Math.max(dose.min, reps - 2);
    }
    doseText = `${reps} reps${side}`;
    workSec = reps * 3 * sides + (note?.startsWith("+") ? 10 : 0) + (note?.startsWith("3-second") ? reps * 2 * sides : 0);
  }

  return {
    id: `${index}-${ex.name}`,
    name: ex.name,
    group: ex.group,
    variation: variation?.label ?? null,
    sets,
    dose: doseText,
    note,
    cue: ex.cue,
    caution: ex.caution ?? null,
    seconds: sets * (workSec + REST_SEC) + TRANSITION_SEC,
  };
}

// Near-duplicates share a family, and a routine gets at most one from each
// (no glute bridge AND single-leg glute bridge in the same session).
const FAMILY: Record<string, string> = {
  "Glute bridge": "bridge",
  "Hip thrust": "bridge",
  "Single-leg glute bridge": "bridge",
  Clamshell: "abduction",
  "Side-lying hip abduction": "abduction",
  "Scissor kicks": "kicks",
  "Flutter kicks": "kicks",
  "Pallof hold": "pallof",
  "Pallof press with rotation": "pallof",
  "Half-kneeling band chop": "chop",
  "Half-kneeling band lift": "chop",
  "Band pull-apart": "rear-delt",
  "Band face pull": "rear-delt",
};

// Within each group, easier activation moves come first and the hardest
// last, so the early exercises warm you up for the later ones.
const LEVEL: Record<string, number> = {
  "Glute bridge": 1,
  Clamshell: 1,
  "Fire hydrant": 1,
  "Donkey kick": 1,
  "Bird dog": 1,
  "Dead bug": 1,
  "Band external rotation": 1,
  "Band pull-apart": 1,
  "Wall slide": 1,
  "Open book": 1,
  "Single-leg glute bridge": 3,
  "Single-leg RDL": 3,
  "Hollow body hold": 3,
  "Bear hold": 3,
  "Half Turkish get-up": 3,
};

export function familyOf(name: string): string {
  return FAMILY[name] ?? name;
}

function levelOf(name: string): number {
  return LEVEL[name] ?? 2;
}

function sortRoutine(items: RoutineItem[]): RoutineItem[] {
  return [...items].sort(
    (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || levelOf(a.name) - levelOf(b.name)
  );
}

/** Build a routine that fills roughly `minutes`, balanced across glutes, core and shoulders. */
export function generateRoutine(minutes: number, date: string, rand: Rand = Math.random): Routine {
  const target = minutes * 60;
  const used = new Set<string>();
  const filled: Record<Group, number> = { glutes: 0, core: 0, shoulders: 0 };
  const items: RoutineItem[] = [];
  let total = 0;

  // Longer sessions get more sets per exercise, not just more exercises.
  const setOptions = minutes <= 20 ? [2] : minutes <= 35 ? [2, 3] : [3];

  while (total < target - 60) {
    // The group furthest behind its share goes next.
    const group = (Object.keys(SHARE) as Group[])
      .filter((g) => LIBRARY.some((e) => e.group === g && !used.has(familyOf(e.name))))
      .sort((a, b) => filled[a] / SHARE[a] - filled[b] / SHARE[b])[0];
    if (!group) break;

    const ex = pick(
      LIBRARY.filter((e) => e.group === group && !used.has(familyOf(e.name))),
      rand
    );
    used.add(familyOf(ex.name));

    let item = buildItem(ex, pick(setOptions, rand), rand, items.length);
    // Near the end, trim sets rather than blow well past the time asked for.
    while (item.sets > 1 && total + item.seconds > target + 90) {
      item = { ...item, sets: item.sets - 1, seconds: item.seconds - Math.round((item.seconds - TRANSITION_SEC) / item.sets) };
    }
    if (total + item.seconds > target + 150 && items.length > 0) continue;

    items.push(item);
    filled[group] += item.seconds;
    total += item.seconds;
  }

  return { date, minutes, items: sortRoutine(items), estimatedMinutes: Math.round(total / 60) };
}

/**
 * Swap one exercise for a different one from the same group (glutes for
 * glutes, core for core), keeping its number of sets and avoiding anything
 * from a family already in the routine. Returns the routine unchanged if
 * there's nothing left to swap in.
 */
export function swapExercise(routine: Routine, itemId: string, rand: Rand = Math.random): Routine {
  const current = routine.items.find((i) => i.id === itemId);
  if (!current) return routine;
  const taken = new Set(routine.items.filter((i) => i.id !== itemId).map((i) => familyOf(i.name)));
  taken.add(familyOf(current.name));
  const options = LIBRARY.filter((e) => e.group === current.group && !taken.has(familyOf(e.name)));
  if (options.length === 0) return routine;
  const ex = pick(options, rand);
  const next = buildItem(ex, current.sets, rand, routine.items.length);
  const swapped = { ...next, id: `${next.id}-${Math.floor(rand() * 1e6)}` };
  const items = sortRoutine(routine.items.map((i) => (i.id === itemId ? swapped : i)));
  const seconds = items.reduce((t, i) => t + i.seconds, 0);
  return { ...routine, items, estimatedMinutes: Math.round(seconds / 60) };
}

export function canSwap(routine: Routine, itemId: string): boolean {
  const current = routine.items.find((i) => i.id === itemId);
  if (!current) return false;
  const taken = new Set(routine.items.map((i) => familyOf(i.name)));
  return LIBRARY.some((e) => e.group === current.group && !taken.has(familyOf(e.name)));
}

export const DURATION_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
