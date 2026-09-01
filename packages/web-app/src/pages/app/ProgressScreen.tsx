import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, SKILL_CATEGORIES, formatScore, scoreGoodness, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { WeeklyGoalRing } from "../../components/WeeklyGoalRing";
import { CategoryIcon } from "../../components/CategoryIcon";
import { GolfableScorePanel } from "../../components/GolfableScorePanel";
import {
  getScoreHistory,
  getSessionsThisWeek,
  getUpcomingGolfables,
  type GolfableCalendarEntry,
  type ScoreHistoryEntry,
} from "../../lib/golfableApi";

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

const RECENT_SCORES_INITIAL_LIMIT = 5;
const UPCOMING_LIMIT = 5;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CategoryStats {
  count: number;
  best: ScoreHistoryEntry | null;
}

function ChevronIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${className} transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UpcomingRow({ entry }: { entry: GolfableCalendarEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 text-left">
        <div
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[entry.drill.category]}`}
        >
          <CategoryIcon category={entry.drill.category} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
          <p className="font-body text-sm text-neutral-500">{formatDate(entry.date)}</p>
        </div>
        <ChevronIcon open={open} className="h-5 w-5 flex-none text-neutral-400" />
      </button>
      {open && (
        <p className="font-body mt-3 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
          {entry.drill.setup.description}
        </p>
      )}
    </div>
  );
}

export function ProgressScreen() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;

  const [loading, setLoading] = useState(true);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [visibleScoreCount, setVisibleScoreCount] = useState(RECENT_SCORES_INITIAL_LIMIT);
  const [upcoming, setUpcoming] = useState<GolfableCalendarEntry[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [weekCount, scoreHistory, upcomingGolfables] = await Promise.all([
        getSessionsThisWeek(userId),
        getScoreHistory(userId),
        getUpcomingGolfables(),
      ]);
      setSessionsThisWeek(weekCount);
      setHistory(scoreHistory);
      setUpcoming(upcomingGolfables);
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
    const goodness = scoreGoodness(entry.score, entry.maxScore, entry.drill.scoreDirection);
    const bestGoodness = stats.best
      ? scoreGoodness(stats.best.score, stats.best.maxScore, stats.best.drill.scoreDirection)
      : -Infinity;
    if (!stats.best || goodness > bestGoodness) {
      stats.best = entry;
    }
  }

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
      <GolfableScorePanel history={history} />

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
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[category]}`}
              >
                <CategoryIcon category={category} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label text-sm font-semibold">{info.label}</p>
                <p className="font-body text-sm text-neutral-500">
                  {stats.count === 0
                    ? "Not played yet"
                    : `${stats.count} played -- best ${formatScore(stats.best!.score, stats.best!.maxScore, stats.best!.drill.scoreDirection)} on ${stats.best!.drill.name}`}
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
          {history.slice(0, visibleScoreCount).map((entry, i) => {
            const info = CATEGORY_INFO[entry.drill.category];
            return (
              <div
                key={`${entry.drill.id}-${entry.createdAt}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5"
              >
                <div
                  className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[entry.drill.category]}`}
                >
                  <CategoryIcon category={entry.drill.category} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
                  <p className="font-body text-sm text-neutral-500">{formatDate(entry.createdAt)}</p>
                  <Link
                    to={`/app/play/${entry.drill.id}`}
                    className="font-label text-brand mt-0.5 inline-block text-xs font-semibold underline"
                  >
                    Play Again
                  </Link>
                </div>
                <span className="font-label bg-brand/10 text-brand flex-none rounded-full px-3 py-1 text-sm font-semibold">
                  {formatScore(entry.score, entry.maxScore, entry.drill.scoreDirection)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {history.length > visibleScoreCount && (
        <button
          type="button"
          onClick={() => setVisibleScoreCount(history.length)}
          className="font-label text-brand mt-3 block w-full text-center text-sm font-semibold"
        >
          View More
        </button>
      )}

      <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        Upcoming Golfables
      </h2>
      {upcoming.length === 0 ? (
        <p className="font-body text-sm text-neutral-500">Nothing scheduled yet -- check back soon.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.slice(0, UPCOMING_LIMIT).map((entry) => (
            <UpcomingRow key={entry.date} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
