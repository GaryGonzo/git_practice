import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, TIER_INFO, formatScore } from "@golfable/shared";
import type { Drill, HandicapTier } from "@golfable/shared";

const TIER_TEXT: Record<HandicapTier, string> = {
  scratch: "text-tier-scratch",
  low: "text-tier-low",
  mid: "text-tier-mid",
  high: "text-tier-high",
};
import { useAuth } from "../../lib/AuthProvider";
import { WeeklyGoalBar } from "../../components/WeeklyGoalBar";
import { GolfableScorePanel } from "../../components/GolfableScorePanel";
import { NotificationBadge } from "../../components/NotificationBadge";
import { ForumIcon } from "../../components/AppNav";
import {
  getDrillForDate,
  getForumNotificationCounts,
  getGlobalLeaderboard,
  getMyScoreForDate,
  getScoreHistory,
  getSessionsThisWeek,
  getStudioById,
  getStudioLeaderboard,
  todayISO,
  type LeaderboardEntry,
  type ScoreHistoryEntry,
  type Studio,
} from "../../lib/golfableApi";

const LEADERBOARD_LIMIT = 5;

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChooseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChallengeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13v3m-3 4h6m-3-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [maxScore, setMaxScore] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [forumUnread, setForumUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    getForumNotificationCounts().then((counts) =>
      setForumUnread(Object.values(counts).reduce((sum, n) => sum + n, 0))
    );
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const studioResult = profile.studio_id ? await getStudioById(profile.studio_id) : null;
      setStudio(studioResult);

      const found = await getDrillForDate(todayISO());
      if (found) {
        setDrill(found.drill);
        setMaxScore(found.maxScore);
        setScore(await getMyScoreForDate(profile.id, found.drill.id, todayISO()));
        setLeaderboard(
          studioResult
            ? await getStudioLeaderboard(
                studioResult.id,
                found.drill.id,
                todayISO(),
                LEADERBOARD_LIMIT,
                found.drill.scoreDirection
              )
            : await getGlobalLeaderboard(found.drill.id, todayISO(), LEADERBOARD_LIMIT, found.drill.scoreDirection)
        );
      } else {
        setDrill(null);
        setLeaderboard([]);
      }
      setSessionsThisWeek(await getSessionsThisWeek(profile.id));
      setScoreHistory(await getScoreHistory(profile.id));
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">Welcome back</p>
      <h1 className="font-display text-3xl tracking-wide">{profile.first_name}</h1>
      {studio && (
        <p className="font-label text-brand mt-1 text-xs font-semibold tracking-wide">Golfable × {studio.name}</p>
      )}

      <div className="mt-4">
        <WeeklyGoalBar completed={sessionsThisWeek} goal={profile.weekly_goal} />
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center font-body text-neutral-500">
          Loading…
        </div>
      ) : drill ? (
        <Link
          to="/app/today"
          className="mt-6 block overflow-hidden rounded-2xl shadow-lg shadow-black/10 transition active:scale-[0.99] active:shadow-md"
        >
          <div className={`px-5 pt-5 pb-6 text-white ${CATEGORY_BG[drill.category]}`}>
            <p className="font-label text-xs font-semibold tracking-widest text-white/80 uppercase">
              {CATEGORY_INFO[drill.category].label} · Today's Golfable
            </p>
            <h2 className="font-display mt-1 text-4xl leading-tight tracking-wide">{drill.name}</h2>
          </div>
          <div className="flex items-center justify-between bg-white px-5 py-4">
            <p className="font-body text-sm text-neutral-600">
              {score === null ? "Play it now and log your score" : `You scored ${formatScore(score, maxScore, drill.scoreDirection)}`}
            </p>
            <span
              className={`font-label inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white ${CATEGORY_BG[drill.category]}`}
            >
              {score === null ? "Play" : "View"}
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center font-body text-neutral-500">
          No Golfable scheduled for today yet — check back soon.
        </div>
      )}

      <Link
        to="/app/library"
        className="mt-3 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div className="bg-brand/10 flex h-10 w-10 flex-none items-center justify-center rounded-full">
          <ChooseIcon className="text-brand h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label text-sm font-semibold">Choose Your Own Golfable</p>
          <p className="font-body text-xs text-neutral-500">Build your own program -- pick any drill in the library</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 flex-none text-neutral-400" />
      </Link>

      {!loading && drill && (
        <div className="mt-6">
          <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            {studio ? `${studio.name} Leaderboard` : "Live Leaderboard"}
          </h2>
          {leaderboard.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center font-body text-sm text-neutral-500">
              {studio ? "No scores logged yet today at your studio — be the first!" : "No scores logged yet today — be the first!"}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => {
                const rank = i + 1;
                const isMe = entry.userId === profile.id;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      isMe ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div
                      className={`font-display flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm ${
                        rank <= 3 ? "bg-gold text-white" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {rank}
                    </div>
                    <p className="font-label min-w-0 flex-1 truncate text-sm font-semibold">
                      {entry.firstName}
                      {isMe && <span className="text-brand"> (you)</span>}
                      <span className={`ml-1.5 text-xs font-semibold ${TIER_TEXT[entry.tier]}`}>
                        {TIER_INFO[entry.tier].label}
                      </span>
                    </p>
                    <span className="font-label flex-none rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-600">
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            to={`/app/leaderboard/${drill.id}/${todayISO()}`}
            className="font-label text-brand mt-3 block text-center text-sm font-semibold"
          >
            {studio ? "View National Golfable Leaderboard →" : "View Full Leaderboard →"}
          </Link>
        </div>
      )}

      <Link
        to="/app/challenges"
        className="border-gold/40 bg-gold/5 mt-4 flex items-center gap-3 rounded-lg border p-4"
      >
        <div className="bg-gold/15 flex h-10 w-10 flex-none items-center justify-center rounded-full">
          <ChallengeIcon className="text-gold h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label text-sm font-semibold">Challenge a Friend</p>
          <p className="font-body text-xs text-neutral-500">Pick a drill, invite friends on the range, live scores</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 flex-none text-neutral-400" />
      </Link>

      {!loading && (
        <div className="mt-6">
          <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            My Golfable Scores
          </h2>
          <GolfableScorePanel history={scoreHistory} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/app/library" className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="font-label text-sm font-semibold">Library</p>
          <p className="font-body text-xs text-neutral-500">Past Golfables</p>
        </Link>
        <Link to="/app/progress" className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="font-label text-sm font-semibold">Progress</p>
          <p className="font-body text-xs text-neutral-500">Your trend</p>
        </Link>
        <Link
          to="/app/forum"
          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3"
        >
          <span className="flex items-center gap-2">
            <ForumIcon className="h-4 w-4 flex-none text-neutral-400" />
            <span>
              <p className="font-label text-sm font-semibold">Forum</p>
              <p className="font-body text-xs text-neutral-500">Talk shop</p>
            </span>
          </span>
          <NotificationBadge count={forumUnread} />
        </Link>
        <Link to="/app/tools" className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="font-label text-sm font-semibold">Tools</p>
          <p className="font-body text-xs text-neutral-500">Metronome & more</p>
        </Link>
      </div>
    </div>
  );
}
