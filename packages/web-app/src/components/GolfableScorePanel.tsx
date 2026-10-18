import { Link } from "react-router-dom";
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
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
      <Link to="/app/golfable-score" className="flex items-center justify-between gap-3 px-4 py-3.5 active:bg-neutral-50">
        <div className="min-w-0">
          <p className="font-label text-[1.05rem] font-semibold text-neutral-900">Golfable Score</p>
          <p className="font-body text-sm text-neutral-500">
            {overallScore !== null
              ? "Across all four clubs"
              : `Log ${GOLFABLE_SCORE_MIN_ATTEMPTS} in every club to unlock`}
          </p>
        </div>
        {overallScore !== null ? (
          <p className="font-display text-brand text-4xl leading-none">
            {overallScore}
            <span className="text-base text-neutral-400">/100</span>
          </p>
        ) : (
          <span className="font-label rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-500">Locked</span>
        )}
      </Link>
      <div className="grid grid-cols-4 border-t border-neutral-100">
        {SKILL_CATEGORIES.map((category, i) => {
          const info = CATEGORY_INFO[category];
          const score = categoryScores[category];
          const attempts = categoryAttempts[category];
          return (
            <Link
              key={category}
              to={`/app/golfable-score/${category}`}
              className={`flex flex-col items-center px-1 py-3 text-center active:bg-neutral-50 ${i > 0 ? "border-l border-neutral-100" : ""}`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${CATEGORY_BG[category]}`}>
                <CategoryIcon category={category} className="h-4 w-4" />
              </span>
              {score !== null ? (
                <p className="font-display mt-1.5 text-2xl leading-none">{score}</p>
              ) : (
                <div className="mt-2 flex gap-0.5" aria-label={`${attempts} of ${GOLFABLE_SCORE_MIN_ATTEMPTS} logged`}>
                  {Array.from({ length: GOLFABLE_SCORE_MIN_ATTEMPTS }, (_, n) => (
                    <span key={n} className={`h-1.5 w-3 rounded-full ${n < attempts ? CATEGORY_BG[category] : "bg-neutral-200"}`} />
                  ))}
                </div>
              )}
              <p className="font-label mt-1 text-xs font-semibold text-neutral-500">{info.label.split(" ")[0]}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
