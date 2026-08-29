// Standard bag, longest to shortest -- putter excluded since it's not a
// yardage club. One row per club in bag_clubs rather than fixed columns,
// but the app always offers this exact set so "My Bag" reads the same
// for every player.
export const BAG_CLUBS = [
  "Driver",
  "3-Wood",
  "5-Wood",
  "Hybrid",
  "4-Iron",
  "5-Iron",
  "6-Iron",
  "7-Iron",
  "8-Iron",
  "9-Iron",
  "Pitching Wedge",
  "Gap Wedge",
  "Sand Wedge",
  "Lob Wedge",
] as const;
export type BagClub = (typeof BAG_CLUBS)[number];

export interface BagEntry {
  club: BagClub;
  yardage: number | null;
}

// Picks the club whose typical yardage is closest to the drill's target.
// Returns null if the bag has no clubs with a yardage set at all -- the
// caller falls back to a general recommendation in that case.
export function suggestClubForYardage(bag: BagEntry[], targetYardage: number): BagClub | null {
  let closest: BagEntry | null = null;
  let closestDiff = Infinity;
  for (const entry of bag) {
    if (entry.yardage === null) continue;
    const diff = Math.abs(entry.yardage - targetYardage);
    if (diff < closestDiff) {
      closest = entry;
      closestDiff = diff;
    }
  }
  return closest?.club ?? null;
}
