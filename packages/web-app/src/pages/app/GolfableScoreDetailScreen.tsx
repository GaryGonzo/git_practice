import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CATEGORY_INFO, SKILL_CATEGORIES, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { CategoryIcon } from "../../components/CategoryIcon";
import {
  getScoreHistory,
  computeGolfableScores,
  recentCategoryAttempts,
  GOLFABLE_SCORE_MIN_ATTEMPTS,
  GOLFABLE_SCORE_WINDOW,
  type ScoreHistoryEntry,
} from "../../lib/golfableApi";

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isSkillCategory(value: string | undefined): value is SkillCategory {
  return SKILL_CATEGORIES.includes(value as SkillCategory);
}

export function GolfableScoreDetailScreen() {
  const { category: categoryParam } = useParams();
  const { session } = useAuth();
  const userId = session!.user.id;
  const category = isSkillCategory(categoryParam) ? categoryParam : null;

  const [history, setHistory] = useState<ScoreHistoryEntry[] | null>(null);

  useEffect(() => {
    getScoreHistory(userId).then(setHistory);
  }, [userId]);

  if (history === null) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  const { categoryScores, overallScore } = computeGolfableScores(history);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link
        to={category ? "/app/golfable-score" : "/app"}
        className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500"
      >
        <BackIcon className="h-4 w-4" />
        {category ? "Back to Golfable Score" : "Back"}
      </Link>

      {category ? (
        <CategoryScoreDetail category={category} history={history} score={categoryScores[category]} />
      ) : (
        <OverallScoreDetail categoryScores={categoryScores} overallScore={overallScore} />
      )}
    </div>
  );
}

function OverallScoreDetail({
  categoryScores,
  overallScore,
}: {
  categoryScores: Record<SkillCategory, number | null>;
  overallScore: number | null;
}) {
  return (
    <div>
      <h1 className="font-display mt-3 text-2xl tracking-wide">Golfable Score</h1>

      <div className="bg-brand mt-4 rounded-lg p-5 text-center text-white">
        <p className="font-label text-sm font-semibold tracking-widest text-white/70 uppercase">Your Score</p>
        <p className="font-display text-5xl">{overallScore ?? "--"}</p>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">How it's calculated</p>
        <p className="font-body mt-2 text-sm text-neutral-700">
          Your Golfable Score is the average of your four category scores below. Each category score is its own
          average -- see a category for the breakdown of what makes it up. You need a score in all 4 categories
          before this unlocks.
        </p>
      </div>

      <h2 className="font-label mt-6 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        Category Scores
      </h2>
      <div className="space-y-2">
        {SKILL_CATEGORIES.map((category) => {
          const info = CATEGORY_INFO[category];
          const score = categoryScores[category];
          return (
            <Link
              key={category}
              to={`/app/golfable-score/${category}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 active:bg-neutral-50"
            >
              <div
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[category]}`}
              >
                <CategoryIcon category={category} className="h-4 w-4" />
              </div>
              <p className="font-label min-w-0 flex-1 text-sm font-semibold">{info.label}</p>
              <span className="font-display text-xl">{score ?? "--"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CategoryScoreDetail({
  category,
  history,
  score,
}: {
  category: SkillCategory;
  history: ScoreHistoryEntry[];
  score: number | null;
}) {
  const info = CATEGORY_INFO[category];
  const attempts = recentCategoryAttempts(history, category);

  return (
    <div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[category]}`}
        >
          <CategoryIcon category={category} className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl tracking-wide">{info.label} Score</h1>
      </div>

      <div className="bg-brand mt-4 rounded-lg p-5 text-center text-white">
        <p className="font-label text-sm font-semibold tracking-widest text-white/70 uppercase">
          {info.label} Score
        </p>
        <p className="font-display text-5xl">{score ?? "--"}</p>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">How it's calculated</p>
        <p className="font-body mt-2 text-sm text-neutral-700">
          {score === null ? (
            <>
              Needs {GOLFABLE_SCORE_MIN_ATTEMPTS}+ logged {info.label} Golfables to unlock -- you're at{" "}
              {attempts.length}/{GOLFABLE_SCORE_MIN_ATTEMPTS}.
            </>
          ) : (
            <>
              The average of your {attempts.length} most recent {info.label} attempts, each counted as a percentage
              of that drill's max score.
            </>
          )}{" "}
          Only your most recent {GOLFABLE_SCORE_WINDOW} attempts ever count, so an old bad stretch rolls off as you
          keep playing.
        </p>
      </div>

      <h2 className="font-label mt-6 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        Attempts Counted
      </h2>
      {attempts.length === 0 ? (
        <p className="font-body text-sm text-neutral-500">Play a {info.label} Golfable to get started.</p>
      ) : (
        <div className="space-y-2">
          {attempts.map((entry, i) => (
            <div
              key={`${entry.drill.id}-${entry.createdAt}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
                <p className="font-body text-sm text-neutral-500">{formatDate(entry.createdAt)}</p>
              </div>
              <span className="font-label bg-brand/10 text-brand flex-none rounded-full px-3 py-1 text-sm font-semibold">
                {entry.score}/{entry.maxScore} · {Math.round((entry.score / entry.maxScore) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
