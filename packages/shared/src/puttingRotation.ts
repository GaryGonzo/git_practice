// No 3 Putts and 18 Holes are two scoring lenses (points vs. total putts)
// on the same physical round -- 18 putts at varying distances, played once
// and logged twice. The distances are generated from the date rather than
// stored, so both drills agree on the same round, and so every player
// sees the identical layout on a given day (fair to compare on that
// day's leaderboard) while still varying day to day.
export const PUTTING_ROTATION_DRILL_IDS = ["no-3-putts", "18-holes"] as const;

interface DistanceBand {
  min: number;
  max: number;
  count: number;
}

// Loosely modeled on published putt-distance data (most putts cluster
// short-to-mid range, with a handful of longer lag putts) without
// reproducing any particular source's exact figures.
const DISTANCE_BANDS: DistanceBand[] = [
  { min: 3, max: 5, count: 3 },
  { min: 6, max: 8, count: 3 },
  { min: 9, max: 11, count: 4 },
  { min: 12, max: 14, count: 4 },
  { min: 15, max: 20, count: 4 },
];

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The 18 putt distances (in feet) for a given date's round -- deterministic
 * per date, so it's identical for every player and both drills, but
 * different from day to day.
 */
export function generatePuttingHoleDistances(date: string): number[] {
  const random = mulberry32(hashSeed(`putting-round-${date}`));
  const distances: number[] = [];
  for (const band of DISTANCE_BANDS) {
    for (let i = 0; i < band.count; i++) {
      distances.push(band.min + Math.round(random() * (band.max - band.min)));
    }
  }
  for (let i = distances.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [distances[i], distances[j]] = [distances[j], distances[i]];
  }
  return distances;
}
