import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Drill } from "@golfable/shared";
import { TIER_INFO } from "@golfable/shared";
import { DrillFreshView } from "../../components/DrillFreshView";
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10v3.5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 5h3v1.5A3.5 3.5 0 0 1 17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 12.5V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 20h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.5 16.5h5l.8 3.5h-6.6l.8-3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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
    await submitScore(userId, drill.id, value, date);
    const board = await getTierLeaderboard(drill.id, profile.tier, date);
    setSubmitting(false);
    setSubmittedScore(value);
    setSessionsThisWeek((n) => n + 1);
    setLeaderboard(board);
  }

  if (loading || !profile) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  if (!drill) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">
          {isToday
            ? "No Golfable is scheduled for today yet — check back soon."
            : "No Golfable was scheduled for this date."}
        </p>
      </div>
    );
  }

  const tierTarget = drill.targets[profile.tier];
  const tierInfo = TIER_INFO[profile.tier];
  const rank = leaderboard.findIndex((entry) => entry.username === profile.username) + 1;

  if (submittedScore === null) {
    return (
      <div className="pb-24">
        <DrillFreshView
          drill={drill}
          tier={profile.tier}
          maxScore={maxScore}
          weeklyGoal={profile.weekly_goal}
          sessionsThisWeek={sessionsThisWeek}
          scoreInput={scoreInput}
          onScoreInputChange={setScoreInput}
          onSubmit={handleSubmit}
          submitting={submitting}
          eyebrow={isToday ? "Today's Golfable" : `Catching Up · ${formatDate(date)}`}
          subtitle={isToday ? "Everyone trains this one today" : "Play it now and log your score"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 px-4 pt-6 pb-24">
      <div className="bg-brand rounded-lg p-5 text-center text-white">
        <p className="font-label text-sm font-semibold tracking-widest text-white/70 uppercase">
          You scored
        </p>
        <p className="font-display text-5xl">
          {submittedScore}/{maxScore}
        </p>
        <p className="font-body mt-1 text-sm text-white/80">
          {submittedScore >= Number(tierTarget.split("/")[0])
            ? `Target hit — ${tierInfo.label} target was ${tierTarget}`
            : `Target was ${tierTarget} — keep after it`}
          {lastAttempt !== null && (
            <>
              {" · "}
              {submittedScore > lastAttempt
                ? `up from ${lastAttempt} last time`
                : submittedScore < lastAttempt
                  ? `down from ${lastAttempt} last time`
                  : `same as last time`}
            </>
          )}
        </p>
      </div>

      {rank > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="bg-gold/15 flex h-11 w-11 flex-none items-center justify-center rounded-full">
            <TrophyIcon className="text-gold h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg tracking-wide">
              You're #{rank} in {tierInfo.label} {isToday ? "today" : `on ${formatDate(date)}`}
            </p>
            <p className="font-body text-xs text-neutral-500">
              {isToday ? "Resets tomorrow with the next Golfable" : "Logged from the Library"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
