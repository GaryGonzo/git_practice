import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Drill } from "@golfable/shared";
import { TIER_INFO } from "@golfable/shared";
import { DrillFreshView } from "../../components/DrillFreshView";
import { ScoreCelebration } from "../../components/ScoreCelebration";
import { useAuth } from "../../lib/AuthProvider";
import {
  getDrillForDate,
  getSessionsThisWeek,
  getMyScoreForDate,
  getLastAttemptScore,
  submitScore,
  getTierLeaderboard,
  todayISO,
  type LeaderboardEntry,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function TodayScreen() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;
  const { date: dateParam } = useParams();
  const date = dateParam ?? todayISO();
  const isToday = date === todayISO();

  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [maxScore, setMaxScore] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      setSubmittedScore(null);
      setScoreInput("");
      setLeaderboard([]);

      const found = await getDrillForDate(date);
      if (!found) {
        setDrill(null);
        setLoading(false);
        return;
      }
      setDrill(found.drill);
      setMaxScore(found.maxScore);

      const [weekCount, existingScore, last] = await Promise.all([
        getSessionsThisWeek(userId),
        getMyScoreForDate(userId, found.drill.id, date),
        getLastAttemptScore(userId, found.drill.id, date),
      ]);
      setSessionsThisWeek(weekCount);
      setLastAttempt(last);
      if (existingScore !== null) {
        setSubmittedScore(existingScore);
        const board = await getTierLeaderboard(found.drill.id, profile.tier, date);
        setLeaderboard(board);
      }
      setLoading(false);
    })();
  }, [profile, userId, date]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!drill || !profile) return;
    const value = Number(scoreInput);
    if (!Number.isFinite(value) || value < 0 || value > maxScore) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitScore(userId, drill.id, value, date);
      const board = await getTierLeaderboard(drill.id, profile.tier, date);
      setSubmittedScore(value);
      setSessionsThisWeek((n) => n + 1);
      setLeaderboard(board);
      setCelebrating(true);
    } catch {
      setSubmitError("Couldn't save your score -- check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const backLink = !isToday && (
    <div className="mx-auto max-w-md px-4 pt-4">
      <Link to="/app/library" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back to Library
      </Link>
    </div>
  );

  if (loading || !profile) {
    return (
      <div>
        {backLink}
        <div className="p-6 text-center font-body text-neutral-500">Loading…</div>
      </div>
    );
  }

  if (!drill) {
    return (
      <div>
        {backLink}
        <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
          <p className="font-body text-neutral-600">
            {isToday
              ? "No Golfable is scheduled for today yet — check back soon."
              : "No Golfable was scheduled for this date."}
          </p>
        </div>
      </div>
    );
  }

  const rank = leaderboard.findIndex((entry) => entry.userId === profile.id) + 1;
  const tierLabel = TIER_INFO[profile.tier].label;

  return (
    <div className="pb-24">
      {celebrating && (
        <ScoreCelebration firstName={profile.first_name} onDone={() => setCelebrating(false)} />
      )}
      {backLink}
      <DrillFreshView
        drill={drill}
        tier={profile.tier}
        maxScore={maxScore}
        weeklyGoal={profile.weekly_goal}
        sessionsThisWeek={sessionsThisWeek}
        scoreInput={scoreInput}
        onScoreInputChange={(value) => {
          setScoreInput(value);
          setSubmitError(null);
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={submitError}
        eyebrow={
          isToday ? "Today's Golfable" : `${submittedScore === null ? "Catching Up" : "Completed"} · ${formatDate(date)}`
        }
        subtitle={
          isToday
            ? "Everyone trains this one today"
            : submittedScore === null
              ? "Play it now and log your score"
              : "Here's what you played"
        }
        result={
          submittedScore === null
            ? undefined
            : {
                score: submittedScore,
                lastAttempt,
                rank,
                rankLabel: `You're #${rank} in ${tierLabel} ${isToday ? "today" : `on ${formatDate(date)}`}`,
                rankSublabel: isToday ? "Resets tomorrow with the next Golfable" : "Logged from the Library",
                leaderboardHref: `/app/leaderboard/${drill.id}/${date}`,
              }
        }
      />
    </div>
  );
}
