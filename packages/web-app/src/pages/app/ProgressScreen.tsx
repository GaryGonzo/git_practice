import { useEffect, useState } from "react";
import { CATEGORY_INFO, SKILL_CATEGORIES, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { WeeklyGoalRing } from "../../components/WeeklyGoalRing";
import { getScoreHistory, getSessionsThisWeek, type ScoreHistoryEntry } from "../../lib/golfableApi";

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CategoryStats {
  count: number;
  best: ScoreHistoryEntry | null;
}

export function ProgressScreen() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;

  const [loading, setLoading] = useState(true);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [weekCount, scoreHistory] = await Promise.all([getSessionsThisWeek(userId), getScoreHistory(userId)]);
      setSessionsThisWeek(weekCount);
      setHistory(scoreHistory);
      setLoading(false);
    })();
  }, [userId]);

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        <p className="font-body text-center text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  const categoryStats = new Map<SkillCategory, CategoryStats>();
  for (const category of SKILL_CATEGORIES) categoryStats.set(category, { count: 0, best: null });
  for (const entry of history) {
    const stats = categoryStats.get(entry.drill.category)!;
    stats.count += 1;
    if (!stats.best || entry.score / entry.maxScore > stats.best.score / stats.best.maxScore) {
      stats.best = entry;
    }
  }

  // My Golfable Scores: a category needs 3+ logged attempts before it
  // populates, computed live off every score ever logged in that category
  // (not just the best one) -- so it moves as your recent play does, not
  // just when you set a new personal best.
  const GOLFABLE_SCORE_MIN_ATTEMPTS = 3;
  const categoryGolfableScores = new Map<SkillCategory, number | null>();
  for (const category of SKILL_CATEGORIES) {
    const entries = history.filter((h) => h.drill.category === category);
    if (entries.length < GOLFABLE_SCORE_MIN_ATTEMPTS) {
      categoryGolfableScores.set(category, null);
      continue;
    }
    const avgPct = entries.reduce((sum, e) => sum + e.score / e.maxScore, 0) / entries.length;
    categoryGolfableScores.set(category, Math.round(avgPct * 100));
  }
  const allCategoryScores = SKILL_CATEGORIES.map((c) => categoryGolfableScores.get(c)!);
  const overallGolfableScore = allCategoryScores.every((s) => s !== null)
    ? Math.round(allCategoryScores.reduce((sum, s) => sum + s!, 0) / allCategoryScores.length)
    : null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Progress</h1>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4">
        <WeeklyGoalRing completed={sessionsThisWeek} goal={profile.weekly_goal} size={72} />
        <div>
          <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            This week
          </p>
          <p className="font-body mt-1 text-sm text-neutral-600">
            {sessionsThisWeek >= profile.weekly_goal
              ? "Goal hit -- anything else is a bonus."
              : `${profile.weekly_goal - sessionsThisWeek} more to hit your weekly goal.`}
          </p>
        </div>
      </div>

      <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        My Golfable Scores
      </h2>
      {overallGolfableScore !== null && (
        <div className="bg-brand mb-2 rounded-lg p-4 text-center text-white">
          <p className="font-label text-sm font-semibold tracking-widest text-white/70 uppercase">
            Overall Golfable Score
          </p>
          <p className="font-display text-4xl">{overallGolfableScore}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {SKILL_CATEGORIES.map((category) => {
          const info = CATEGORY_INFO[category];
          const score = categoryGolfableScores.get(category)!;
          const attempts = categoryStats.get(category)!.count;
          return (
            <div key={category} className="rounded-lg border border-neutral-200 bg-white p-3.5 text-center">
              <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                {info.label}
              </p>
              {score !== null ? (
                <p className="font-display text-3xl">{score}</p>
              ) : (
                <p className="font-body mt-1 text-xs text-neutral-500">
                  {attempts}/{GOLFABLE_SCORE_MIN_ATTEMPTS} logged
                </p>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        By Category
      </h2>
      <div className="space-y-2">
        {SKILL_CATEGORIES.map((category) => {
          const info = CATEGORY_INFO[category];
          const stats = categoryStats.get(category)!;
          return (
            <div
              key={category}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5"
            >
              <div
                className={`font-display flex h-9 w-9 flex-none items-center justify-center rounded-full text-base text-white ${CATEGORY_BG[category]}`}
              >
                {info.badge}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label text-sm font-semibold">{info.label}</p>
                <p className="font-body text-sm text-neutral-500">
                  {stats.count === 0
                    ? "Not played yet"
                    : `${stats.count} played -- best ${stats.best!.score}/${stats.best!.maxScore} on ${stats.best!.drill.name}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        Recent Scores
      </h2>
      {history.length === 0 ? (
        <p className="font-body text-sm text-neutral-500">Log a score on Today's Golfable to get started.</p>
      ) : (
        <div className="space-y-2">
          {history.slice(0, 8).map((entry, i) => {
            const info = CATEGORY_INFO[entry.drill.category];
            return (
              <div
                key={`${entry.drill.id}-${entry.createdAt}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5"
              >
                <div
                  className={`font-display flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm text-white ${CATEGORY_BG[entry.drill.category]}`}
                >
                  {info.badge}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
                  <p className="font-body text-sm text-neutral-500">{formatDate(entry.createdAt)}</p>
                </div>
                <span className="font-label bg-brand/10 text-brand flex-none rounded-full px-3 py-1 text-sm font-semibold">
                  {entry.score}/{entry.maxScore}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
