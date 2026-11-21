// Golfable, dumbed down: pick an area of the game and how long you have,
// tap one button, get a practice session built from the drill library.
//
// Drills don't carry a duration, so it's estimated from the ball count in
// the equipment list (e.g. "15 golf balls"): roughly 35 seconds a ball
// plus a few minutes to set up, clamped to 8-20 minutes.

import type { Drill, SkillCategory } from "@golfable/shared";
import { SKILL_CATEGORIES } from "@golfable/shared";

export type Area = SkillCategory | "mix";

export const AREA_OPTIONS: { value: Area; label: string }[] = [
  { value: "mix", label: "Mix" },
  { value: "driver", label: "Driver" },
  { value: "irons", label: "Irons" },
  { value: "wedges", label: "Wedges" },
  { value: "putter", label: "Putter" },
];

export const SESSION_LENGTHS = [15, 30, 45, 60, 75, 90];

const DEFAULT_MINUTES = 12;

export function ballCount(drill: Drill): number | null {
  for (const item of drill.setup.equipment) {
    const match = item.match(/(\d+)\s+(?:golf\s+)?balls?/i);
    if (match) return Number(match[1]);
  }
  return null;
}

export function estimateMinutes(drill: Drill): number {
  const balls = ballCount(drill);
  // Small counts ("2 golf balls (if playing solo)", "1 golf ball") are
  // games where the same balls get hit over and over, not a short drill.
  if (balls === null || balls < 8) return DEFAULT_MINUTES;
  return Math.min(20, Math.max(8, Math.round(balls * 0.6 + 4)));
}

export interface SessionDrill {
  drillId: string;
  name: string;
  category: SkillCategory;
  minutes: number;
  equipment: string[];
}

export interface PracticeSession {
  date: string;
  area: Area;
  minutes: number;
  drills: SessionDrill[];
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

/** Drills played recently go to the back of the line so sessions stay fresh. */
function freshFirst(drills: Drill[], recent: Set<string>, rand: Rand): Drill[] {
  const shuffled = shuffle(drills, rand);
  return [...shuffled.filter((d) => !recent.has(d.id)), ...shuffled.filter((d) => recent.has(d.id))];
}

export function generateSession(
  library: Drill[],
  minutes: number,
  area: Area,
  date: string,
  recentDrillIds: Set<string> = new Set(),
  rand: Rand = Math.random
): PracticeSession {
  // Mix rotates through the four categories (in a random starting order)
  // so a session touches every part of the game before repeating one. A
  // single area is just one list.
  const lists: Drill[][] =
    area === "mix"
      ? shuffle([...SKILL_CATEGORIES], rand).map((c) =>
          freshFirst(
            library.filter((d) => d.category === c),
            recentDrillIds,
            rand
          )
        )
      : [freshFirst(library.filter((d) => d.category === area), recentDrillIds, rand)];

  const picked: SessionDrill[] = [];
  let total = 0;
  let progressed = true;
  while (total < minutes - 4 && progressed) {
    progressed = false;
    for (const list of lists) {
      if (total >= minutes - 4) break;
      // Take the first drill in this list that fits the time left (a little
      // overshoot is fine); if none fits, the category sits this round out.
      const idx = list.findIndex((d) => picked.length === 0 || total + estimateMinutes(d) <= minutes + 5);
      if (idx === -1) continue;
      const [drill] = list.splice(idx, 1);
      const m = estimateMinutes(drill);
      picked.push({ drillId: drill.id, name: drill.name, category: drill.category, minutes: m, equipment: drill.setup.equipment });
      total += m;
      progressed = true;
    }
  }

  return { date, area, minutes, drills: picked, estimatedMinutes: total };
}
