import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { BagEntry, Drill } from "@golfable/shared";
import { CATEGORY_INFO, TIER_INFO, RANK_CARD_CUTOFF, isBetterScore, suggestClubForYardage } from "@golfable/shared";
import { DrillFreshView } from "../../components/DrillFreshView";
import { DrillRatingPrompt } from "../../components/DrillRatingPrompt";
import { CelebrationToast, randomScoreMessage } from "../../components/CelebrationToast";
import { useAuth } from "../../lib/AuthProvider";
import {
  getDrillForDate,
  getDrillById,
  getSessionsThisWeek,
  getMyScoreForDate,
  getLastAttemptScore,
  getPersonalBest,
  submitScore,
  getRankBoard,
  getStudioById,
  getMyBag,
  todayISO,
  type LeaderboardEntry,
  type Studio,
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

const GOAL_MESSAGE = "Goals getting accomplished! Congrats on reaching your weekly target!";
const GOAL_PARTICLES = ["🏆", "🎉", "🙌", "✨"];

export function TodayScreen() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;
  const { date: dateParam, drillId: drillIdParam } = useParams();
  const isChooseYourOwn = Boolean(drillIdParam);
  const date = isChooseYourOwn ? todayISO() : (dateParam ?? todayISO());
  const isToday = !isChooseYourOwn && date === todayISO();

  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [maxScore, setMaxScore] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scoreCelebration, setScoreCelebration] = useState<string | null>(null);
  const [pendingGoalCelebration, setPendingGoalCelebration] = useState(false);
  const [goalCelebration, setGoalCelebration] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [bag, setBag] = useState<BagEntry[]>([]);
  const [studio, setStudio] = useState<Studio | null>(null);

  useEffect(() => {
    getMyBag(userId).then(setBag);
  }, [userId]);

  useEffect(() => {
    if (!profile?.studio_id) {
      setStudio(null);
      return;
    }
    getStudioById(profile.studio_id).then(setStudio);
  }, [profile?.studio_id]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      setSubmittedScore(null);
      setScoreInput("");
      setLeaderboard([]);
      setIsNewPersonalBest(false);
      setShowRatingPrompt(false);

      const found = isChooseYourOwn ? await getDrillById(drillIdParam!) : await getDrillForDate(date);
      if (!found) {
        setDrill(null);
        setLoading(false);
        return;
      }
      setDrill(found.drill);
      setMaxScore(found.maxScore);

      const [weekCount, existingScore, last, best] = await Promise.all([
        getSessionsThisWeek(userId),
        getMyScoreForDate(userId, found.drill.id, date),
        getLastAttemptScore(userId, found.drill.id, date),
        getPersonalBest(userId, found.drill.id, found.drill.scoreDirection),
      ]);
      setSessionsThisWeek(weekCount);
      setLastAttempt(last);
      setPersonalBest(best);
      if (existingScore !== null) {
        setSubmittedScore(existingScore);
        const board = await getRankBoard(
          profile.studio_id,
          found.drill.id,
          profile.tier,
          date,
          found.drill.scoreDirection
        );
        setLeaderboard(board);
      }
      setLoading(false);
    })();
  }, [profile, userId, date, isChooseYourOwn, drillIdParam]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!drill || !profile) return;
    const value = Number(scoreInput);
    if (!Number.isFinite(value) || value < 0 || value > maxScore) return;

    setSubmitting(true);
    setSubmitError(null);
    const isFirstCompletion = personalBest === null;
    try {
      await submitScore(userId, drill.id, value, date);
      const [board, newWeekCount] = await Promise.all([
        getRankBoard(profile.studio_id, drill.id, profile.tier, date, drill.scoreDirection),
        getSessionsThisWeek(userId),
      ]);
      const reachedGoalNow = sessionsThisWeek < profile.weekly_goal && newWeekCount >= profile.weekly_goal;
      const newPersonalBest = personalBest === null || isBetterScore(value, personalBest, drill.scoreDirection);
      setSubmittedScore(value);
      if (isFirstCompletion) setShowRatingPrompt(true);
      setSessionsThisWeek(newWeekCount);
      setIsNewPersonalBest(newPersonalBest);
      setPersonalBest((prev) => (prev === null || isBetterScore(value, prev, drill.scoreDirection) ? value : prev));
      setLeaderboard(board);
      setScoreCelebration(randomScoreMessage(profile.first_name));
      if (reachedGoalNow) setPendingGoalCelebration(true);
    } catch {
      setSubmitError("Couldn't save your score -- check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const backLink = (!isToday || isChooseYourOwn) && (
    <div className="mx-auto max-w-md px-4 pt-4">
      <Link
        to="/app/library"
        className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500"
      >
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
            {isChooseYourOwn
              ? "Couldn't find that drill."
              : isToday
                ? "No Golfable is scheduled for today yet — check back soon."
                : "No Golfable was scheduled for this date."}
          </p>
        </div>
      </div>
    );
  }

  const rawRank = leaderboard.findIndex((entry) => entry.userId === profile.id) + 1;
  const rank = rawRank > 0 && rawRank <= RANK_CARD_CUTOFF ? rawRank : 0;
  const rankScope = studio ? studio.name : TIER_INFO[profile.tier].label;

  return (
    <div className="pb-24">
      {scoreCelebration ? (
        <CelebrationToast
          key="score-celebration"
          message={scoreCelebration}
          onDone={() => {
            setScoreCelebration(null);
            if (pendingGoalCelebration) {
              setPendingGoalCelebration(false);
              setGoalCelebration(true);
            }
          }}
        />
      ) : (
        goalCelebration && (
          <CelebrationToast
            key="goal-celebration"
            message={GOAL_MESSAGE}
            particles={GOAL_PARTICLES}
            onDone={() => setGoalCelebration(false)}
          />
        )
      )}
      {backLink}
      <DrillFreshView
        drill={drill}
        tier={profile.tier}
        maxScore={maxScore}
        weeklyGoal={profile.weekly_goal}
        sessionsThisWeek={sessionsThisWeek}
        date={date}
        scoreInput={scoreInput}
        onScoreInputChange={(value) => {
          setScoreInput(value);
          setSubmitError(null);
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={submitError}
        eyebrow={
          isChooseYourOwn
            ? `Choose Your Own · ${CATEGORY_INFO[drill.category].label}`
            : isToday
              ? "Today's Golfable"
              : `${submittedScore === null ? "Catching Up" : "Completed"} · ${formatDate(date)}`
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
                personalBest,
                isNewPersonalBest,
                rank,
                rankLabel: `You're #${rank} in ${rankScope} ${isToday || isChooseYourOwn ? "today" : `on ${formatDate(date)}`}`,
                rankSublabel: isChooseYourOwn
                  ? "From Choose Your Own"
                  : isToday
                    ? "Resets tomorrow with the next Golfable"
                    : "Logged from the Library",
                leaderboardHref: `/app/leaderboard/${drill.id}/${date}`,
              }
        }
        suggestedClub={
          drill.targetYardage !== undefined ? suggestClubForYardage(bag, drill.targetYardage) : undefined
        }
      />
      {showRatingPrompt && (
        <div className="mx-auto max-w-md px-4">
          <DrillRatingPrompt userId={userId} drillId={drill.id} />
        </div>
      )}
    </div>
  );
}
