import { useState } from "react";
import { CATEGORY_INFO, TIER_INFO } from "@golfable/shared";
import { WeeklyGoalRing } from "../../components/WeeklyGoalRing";
import {
  MOCK_USER,
  TODAYS_DRILL,
  LAST_ATTEMPT_SCORE,
  LEADERBOARD_MID_TIER_OTHERS,
} from "../../mock/todaysDrill";

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

const CATEGORY_TEXT: Record<string, string> = {
  driver: "text-driver",
  irons: "text-irons",
  wedges: "text-wedges",
  putter: "text-putter",
};

const TIER_TEXT: Record<string, string> = {
  scratch: "text-tier-scratch",
  low: "text-tier-low",
  mid: "text-tier-mid",
  high: "text-tier-high",
};

const TIER_BORDER: Record<string, string> = {
  scratch: "border-tier-scratch",
  low: "border-tier-low",
  mid: "border-tier-mid",
  high: "border-tier-high",
};

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

export function TodayScreen() {
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [scoreInput, setScoreInput] = useState("");

  const category = CATEGORY_INFO[TODAYS_DRILL.category];
  const tierTarget = TODAYS_DRILL.targets[MOCK_USER.tier];
  const tierInfo = TIER_INFO[MOCK_USER.tier];
  const maxBalls = 8;

  const sessionsThisWeek = submittedScore === null ? MOCK_USER.sessionsThisWeek : MOCK_USER.sessionsThisWeek + 1;

  const leaderboard =
    submittedScore === null
      ? LEADERBOARD_MID_TIER_OTHERS
      : [...LEADERBOARD_MID_TIER_OTHERS, { username: MOCK_USER.username, score: submittedScore }].sort(
          (a, b) => b.score - a.score
        );
  const rank = leaderboard.findIndex((entry) => entry.username === MOCK_USER.username) + 1;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(scoreInput);
    if (!Number.isFinite(value) || value < 0 || value > maxBalls) return;
    setSubmittedScore(value);
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Today's Golfable
          </p>
          <p className="font-body text-sm text-neutral-500">Everyone trains this one today</p>
        </div>
        <WeeklyGoalRing completed={sessionsThisWeek} goal={MOCK_USER.weeklyGoal} size={64} />
      </div>

      <div className="mb-4 flex items-center gap-2.5">
        <div
          className={`font-display flex h-9 w-9 items-center justify-center rounded-full text-base text-white ${CATEGORY_BG[TODAYS_DRILL.category]}`}
        >
          {category.badge}
        </div>
        <div>
          <p className={`font-label text-xs font-semibold tracking-wide uppercase ${CATEGORY_TEXT[TODAYS_DRILL.category]}`}>
            {category.label}
          </p>
          <h1 className="font-display text-2xl tracking-wide">{TODAYS_DRILL.name}</h1>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label mb-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Setup
        </p>
        <p className="font-body mb-2 text-sm text-neutral-700">{TODAYS_DRILL.setup.description}</p>
        <ul className="font-body list-inside list-disc text-sm text-neutral-600">
          {TODAYS_DRILL.setup.equipment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label mb-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Rules &amp; Scoring
        </p>
        <p className="font-body mb-2 text-sm text-neutral-700">{TODAYS_DRILL.rules.description}</p>
        <ul className="font-body list-inside list-disc text-sm text-neutral-600">
          {TODAYS_DRILL.rules.scoring.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={`mb-6 rounded-lg border-2 bg-white p-4 ${TIER_BORDER[MOCK_USER.tier]}`}>
        <p className="font-label mb-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Your Target &middot; {tierInfo.label}
        </p>
        <p className={`font-display text-4xl ${TIER_TEXT[MOCK_USER.tier]}`}>{tierTarget}</p>
      </div>

      {submittedScore === null ? (
        <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-4">
          <label className="font-label mb-2 block text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Log your score
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={maxBalls}
              required
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              placeholder={`0-${maxBalls}`}
              className="font-body flex-1 rounded-md border border-neutral-300 px-3 py-2"
            />
            <button
              type="submit"
              className="font-label bg-brand rounded-md px-5 py-2 text-sm font-semibold text-white"
            >
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="bg-brand rounded-lg p-5 text-center text-white">
            <p className="font-label text-xs font-semibold tracking-widest text-white/70 uppercase">
              You scored
            </p>
            <p className="font-display text-5xl">
              {submittedScore}/{maxBalls}
            </p>
            <p className="font-body mt-1 text-sm text-white/80">
              {submittedScore >= Number(tierTarget.split("/")[0])
                ? `Target hit — ${tierInfo.label} target was ${tierTarget}`
                : `Target was ${tierTarget} — keep after it`}
              {" · "}
              {submittedScore > LAST_ATTEMPT_SCORE
                ? `up from ${LAST_ATTEMPT_SCORE} last time`
                : submittedScore < LAST_ATTEMPT_SCORE
                  ? `down from ${LAST_ATTEMPT_SCORE} last time`
                  : `same as last time`}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="bg-gold/15 flex h-11 w-11 flex-none items-center justify-center rounded-full">
              <TrophyIcon className="text-gold h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg tracking-wide">
                You're #{rank} in {tierInfo.label} today
              </p>
              <p className="font-body text-xs text-neutral-500">Resets tomorrow with the next Golfable</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
