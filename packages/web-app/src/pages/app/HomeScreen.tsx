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
import { WeeklyGoalRing } from "../../components/WeeklyGoalRing";
import { CategoryIcon } from "../../components/CategoryIcon";
import { PageHeader, FairwayPanel, Section, Panel, Row, IconDot, ChevronRight } from "../../components/ui";
import { GolfableScorePanel } from "../../components/GolfableScorePanel";
import { NotificationBadge } from "../../components/NotificationBadge";
import { ForumIcon, ProgressIcon } from "../../components/AppNav";
import {
  getBlendedScoreHistory,
  getDrillForDate,
  getForumNotificationCounts,
  getGlobalLeaderboard,
  getMyScoreForDate,
  getSessionsThisWeek,
  getStudioById,
  getStudioLeaderboard,
  todayISO,
  type LeaderboardEntry,
  type ScoreHistoryEntry,
  type Studio,
} from "../../lib/golfableApi";

const LEADERBOARD_LIMIT = 3;

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 20V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 4l9 3.5L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="7" cy="20.5" rx="4" ry="1.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
      setScoreHistory(await getBlendedScoreHistory(profile.id));
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  const hasFit = profile.fit_access;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Los_Angeles", hour: "2-digit", hour12: false }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <PageHeader
        kicker={studio ? `${greeting} · ${studio.name}` : greeting}
        title={profile.first_name}
        back={hasFit ? { to: "/app", label: "Home" } : undefined}
        right={<WeeklyGoalRing completed={sessionsThisWeek} goal={profile.weekly_goal} size={60} />}
      />

      <FairwayPanel className="mt-5">
        {loading ? (
          <div className="font-body p-6 text-white/60">Loading today's Golfable…</div>
        ) : drill ? (
          <Link to="/app/today" className="block p-5 active:opacity-90">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${CATEGORY_BG[drill.category]}`}>
                <CategoryIcon category={drill.category} className="h-4 w-4" />
              </span>
              <span className="font-label text-base font-medium text-white/70">
                Today's Golfable, {CATEGORY_INFO[drill.category].label}
              </span>
            </div>
            <h2 className="font-display mt-4 text-[2.9rem] leading-[0.92] tracking-wide">{drill.name}</h2>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="font-body text-sm text-white/70">
                {score === null ? "Not played yet" : `You scored ${formatScore(score, maxScore, drill.scoreDirection)}`}
              </p>
              <span className="font-label bg-gold text-brand-dark inline-flex items-center gap-1 rounded-full px-5 py-2.5 text-base font-bold">
                {score === null ? "Play" : "View"}
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ) : (
          <Link to="/app/library" className="block p-5 active:opacity-90">
            <p className="font-label text-base font-medium text-white/70">No new Golfable today</p>
            <h2 className="font-display mt-3 text-[2.6rem] leading-[0.92] tracking-wide">Pick your own</h2>
            <p className="font-body mt-2 text-sm text-white/70">New Golfables drop Monday to Friday. Any drill in the library counts toward your week.</p>
            <span className="font-label bg-gold text-brand-dark mt-5 inline-flex items-center gap-1 rounded-full px-5 py-2.5 text-base font-bold">
              Open library
              <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        )}
      </FairwayPanel>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { to: "/app/library", label: "Pick a drill", icon: <ChooseIcon className="h-6 w-6" /> },
          { to: "/app/challenges", label: "Challenge", icon: <ChallengeIcon className="h-6 w-6" /> },
          { to: "/app/round", label: "Track round", icon: <FlagIcon className="h-6 w-6" /> },
          { to: "/app/tools", label: "Tools", icon: <ToolsIcon className="h-6 w-6" /> },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-1 py-3 text-center ring-1 ring-black/[0.06] active:bg-neutral-50"
          >
            <span className="text-brand">{a.icon}</span>
            <span className="font-label text-sm leading-tight font-semibold text-neutral-800">{a.label}</span>
          </Link>
        ))}
      </div>

      {!loading && drill && (
        <Section
          title={studio ? `${studio.name} today` : "Today's leaders"}
          action={
            <Link to={`/app/leaderboard/${drill.id}/${todayISO()}`} className="font-label text-brand text-base font-semibold">
              Full board
            </Link>
          }
        >
          <Panel>
            {leaderboard.length === 0 ? (
              <Row title="No scores yet today" sub="Log yours first and take the top spot." />
            ) : (
              leaderboard.slice(0, 3).map((entry, i) => {
                const isMe = entry.userId === profile.id;
                return (
                  <Row
                    key={entry.userId}
                    className={isMe ? "bg-brand/[0.04]" : ""}
                    icon={
                      <span
                        className={`font-display flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                          i === 0 ? "bg-gold text-brand-dark" : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                    }
                    title={
                      <>
                        {entry.firstName}
                        {isMe && <span className="text-brand"> (you)</span>}
                      </>
                    }
                    sub={<span className={TIER_TEXT[entry.tier]}>{TIER_INFO[entry.tier].label}</span>}
                    trailing={<span className="font-display text-2xl">{entry.score}</span>}
                  />
                );
              })
            )}
          </Panel>
        </Section>
      )}

      {!loading && (
        <Section title="Your game">
          <GolfableScorePanel history={scoreHistory} />
        </Section>
      )}

      <Section title="More">
        <Panel>
          <Row to="/app/progress" icon={<IconDot><ProgressIcon className="h-5 w-5" /></IconDot>} title="Progress" sub="Your trend over time" />
          <Row
            to="/app/forum"
            icon={<IconDot><ForumIcon className="h-5 w-5" /></IconDot>}
            title="Forum"
            sub="Talk shop with other players"
            trailing={<NotificationBadge count={forumUnread} />}
          />
        </Panel>
      </Section>
    </div>
  );
}
