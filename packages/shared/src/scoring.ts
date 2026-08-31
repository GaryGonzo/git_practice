// Almost every drill is scored "higher is better" (points, distance
// reached, balls made). A handful -- stroke or putt counts like Hole Out
// -- are the opposite: fewer is better. These helpers centralize that
// comparison so every screen that ranks, compares, or displays a score
// handles both directions the same way, instead of each call site
// re-deriving "which score wins" on its own.
export type ScoreDirection = "higher" | "lower";

/** True if `a` is strictly better than `b` for the given direction. */
export function isBetterScore(a: number, b: number, direction: ScoreDirection): boolean {
  return direction === "lower" ? a < b : a > b;
}

/**
 * Normalizes a raw score to a 0-1 "goodness" fraction, comparable across
 * drills even when their max_score and direction differ (e.g. picking the
 * standout score across every drill in a category for Progress).
 */
export function scoreGoodness(score: number, maxScore: number, direction: ScoreDirection): number {
  if (maxScore <= 0) return 0;
  const ratio = score / maxScore;
  return direction === "lower" ? 1 - ratio : ratio;
}

/**
 * Whether `score` meets a tier's target. Higher-is-better targets are
 * formatted "N/max" (compares score >= N); lower-is-better targets are a
 * plain number of strokes/putts (compares score <= N).
 */
export function isTargetHit(score: number, target: string, direction: ScoreDirection): boolean {
  if (direction === "lower") return score <= Number(target);
  return score >= Number(target.split("/")[0]);
}

/**
 * Formats a raw score for display. "N/max" reads naturally for points
 * (higher is better); for a lower-is-better count, "max" isn't a
 * denominator the number was scored out of, so showing it as a fraction
 * would be misleading -- just the raw count reads correctly.
 */
export function formatScore(score: number, maxScore: number, direction: ScoreDirection): string {
  return direction === "lower" ? `${score}` : `${score}/${maxScore}`;
}
