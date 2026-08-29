import { CATEGORY_INFO, SKILL_CATEGORIES } from "@golfable/shared";
import { computeGolfableScores, GOLFABLE_SCORE_MIN_ATTEMPTS, type ScoreHistoryEntry } from "../lib/golfableApi";
import { CategoryIcon } from "./CategoryIcon";

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

// Shown on both Home and Progress -- one component so the two never show
// different numbers for the same player. A category needs 3+ logged
// attempts before it populates; the overall score needs all 4.
export function GolfableScorePanel({ history }: { history: ScoreHistoryEntry[] }) {
  const { categoryScores, categoryAttempts, overallScore } = computeGolfableScores(history);

  return (
    <div>
      {overallScore !== null ? (
        <div className="bg-brand rounded-lg p-4 text-center text-white">
          <p className="font-label text-sm font-semibold tracking-widest text-white/70 uppercase">
            Golfable Score
          </p>
          <p className="font-display text-4xl">{overallScore}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-center">
          <p className="font-label text-sm font-semibold text-neutral-600">Golfable Score not unlocked yet</p>
          <p className="font-body mt-1 text-xs text-neutral-500">
            Play {GOLFABLE_SCORE_MIN_ATTEMPTS}+ Golfables in every category below to unlock it.
          </p>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        {SKILL_CATEGORIES.map((category) => {
          const info = CATEGORY_INFO[category];
          const score = categoryScores[category];
          const attempts = categoryAttempts[category];
          return (
            <div key={category} className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
              <div
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-white ${CATEGORY_BG[category]}`}
              >
                <CategoryIcon category={category} className="h-4 w-4" />
              </div>
              <p className="font-label mt-1.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                {info.label}
              </p>
              {score !== null ? (
                <p className="font-display text-2xl">{score}</p>
              ) : (
                <p className="font-body mt-0.5 text-xs text-neutral-400">
                  {attempts}/{GOLFABLE_SCORE_MIN_ATTEMPTS} logged
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
