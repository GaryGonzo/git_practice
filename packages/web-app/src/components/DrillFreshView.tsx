import { Link } from "react-router-dom";
import type { Drill, HandicapTier } from "@golfable/shared";
import {
  TIER_INFO,
  isBetterScore,
  isTargetHit,
  formatScore,
  generatePuttingHoleDistances,
  PUTTING_ROTATION_DRILL_IDS,
} from "@golfable/shared";
import { WeeklyGoalRing } from "./WeeklyGoalRing";
import { DrillHeroImage } from "./DrillHeroImage";

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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface DrillResult {
  score: number;
  lastAttempt: number | null;
  personalBest: number | null;
  isNewPersonalBest: boolean;
  rank: number;
  rankLabel: string;
  rankSublabel: string;
  /** When set, the rank card links to the full leaderboard for this drill/date */
  leaderboardHref?: string;
}

interface DrillFreshViewProps {
  drill: Drill;
  tier: HandicapTier;
  maxScore: number;
  weeklyGoal: number;
  sessionsThisWeek: number;
  /** The date this round is being played for -- seeds the putting-rotation distances so everyone playing that day sees the same 18 holes */
  date: string;
  /** false renders the score form as a non-functional preview (marketing use) */
  interactive?: boolean;
  scoreInput?: string;
  onScoreInputChange?: (value: string) => void;
  onSubmit?: (event: React.FormEvent) => void;
  submitting?: boolean;
  eyebrow?: string;
  subtitle?: string;
  /** When set, replaces the score form with the result -- the drill cards above still show for reference */
  result?: DrillResult;
  /** Shown above the score form when a submit attempt failed */
  error?: string | null;
  /** The player's bag-matched club for drill.targetYardage, if both are set */
  suggestedClub?: string | null;
  /** This drill's own rubric, re-scored against the player's best completed
   *  round -- only set for drills with a round-derived mapping (see
   *  ROUND_DERIVED_DRILL_IDS in golfableApi.ts) and only once they have one */
  roundBest?: { score: number; maxScore: number; holesUsed: number; completedAt: string } | null;
}

function formatRoundBestDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// The "fresh arrival" state of the Today screen: drill cards + score form,
// before a score has been logged. Shared by the real TodayScreen and the
// marketing site's app preview so the two never drift apart.
export function DrillFreshView({
  drill,
  tier,
  maxScore,
  weeklyGoal,
  sessionsThisWeek,
  date,
  interactive = true,
  scoreInput = "",
  onScoreInputChange,
  onSubmit,
  submitting = false,
  eyebrow = "Today's Golfable",
  subtitle = "Everyone trains this one today",
  result,
  error,
  suggestedClub,
  roundBest,
}: DrillFreshViewProps) {
  const tierTarget = drill.targets[tier];
  const tierInfo = TIER_INFO[tier];
  const puttingDistances = (PUTTING_ROTATION_DRILL_IDS as readonly string[]).includes(drill.id)
    ? generatePuttingHoleDistances(date)
    : null;

  const pinnedForm = interactive && !result;

  const scoreForm = (
    <form onSubmit={interactive ? onSubmit : (event) => event.preventDefault()} className="flex items-center gap-2">
      <label htmlFor="score-input" className="sr-only">
        Your score
      </label>
      <div className="min-w-0 flex-1">
        <input
          id="score-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={maxScore}
          required={interactive}
          readOnly={!interactive}
          value={scoreInput}
          onChange={(event) => onScoreInputChange?.(event.target.value)}
          placeholder={`Score 0–${maxScore}`}
          className="font-display focus:border-brand focus:ring-brand/20 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-2xl tracking-wide outline-none placeholder:font-label placeholder:text-base placeholder:tracking-normal placeholder:text-neutral-400 focus:ring-4"
        />
      </div>
      <button
        type="submit"
        disabled={!interactive || submitting}
        className="font-label bg-brand flex-none rounded-xl px-5 py-3.5 text-base font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Log score"}
      </button>
    </form>
  );

  return (
    <div className={`mx-auto max-w-md px-4 pt-5 ${pinnedForm ? "pb-36" : "pb-6"}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label text-lg font-semibold text-neutral-900">{eyebrow}</p>
          <p className="font-body text-sm text-neutral-500">{subtitle}</p>
        </div>
        <WeeklyGoalRing completed={sessionsThisWeek} goal={weeklyGoal} size={56} />
      </div>

      <DrillHeroImage drill={drill} />

      <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
        <section className="p-4">
          <h3 className="font-label text-lg font-semibold text-neutral-900">Setup</h3>
          <p className="font-body mt-1 text-[0.95rem] leading-relaxed text-neutral-700">{drill.setup.description}</p>
          {drill.setup.equipment.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {drill.setup.equipment.map((item) => (
                <span key={item} className="font-label rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">
                  {item}
                </span>
              ))}
            </div>
          )}
          {puttingDistances && (
            <div className="mt-4">
              <p className="font-label text-base font-semibold text-neutral-900">Today's 18 holes</p>
              <div className="mt-1.5 grid grid-cols-6 gap-1 text-center">
                {puttingDistances.map((distance, i) => (
                  <div key={i} className="rounded-lg bg-neutral-50 py-1.5 ring-1 ring-black/[0.04]">
                    <p className="font-label text-[0.7rem] font-semibold text-neutral-400">{i + 1}</p>
                    <p className="font-display text-lg leading-none">{distance}</p>
                  </div>
                ))}
              </div>
              <p className="font-body mt-1 text-xs text-neutral-500">Distances in feet.</p>
            </div>
          )}
          {drill.targetYardage !== undefined && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
              <p className="font-body text-sm text-neutral-700">
                <span className="font-display text-xl">{drill.targetYardage}</span> yds
              </p>
              {suggestedClub ? (
                <p className="font-label text-brand text-sm font-semibold">Hit your {suggestedClub}</p>
              ) : (
                <Link to="/app/bag" className="font-label text-sm font-semibold text-neutral-500 underline">
                  Set your bag for a club pick
                </Link>
              )}
            </div>
          )}
        </section>

        <section className="p-4">
          <h3 className="font-label text-lg font-semibold text-neutral-900">How to score</h3>
          <p className="font-body mt-1 text-[0.95rem] leading-relaxed text-neutral-700">{drill.rules.description}</p>
          <ul className="font-body mt-2 space-y-1.5 text-[0.95rem] text-neutral-700">
            {drill.rules.scoring.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="bg-brand mt-2 h-1.5 w-1.5 flex-none rounded-full" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`flex items-center justify-between gap-3 border-l-4 p-4 ${TIER_BORDER[tier]}`}>
          <div>
            <h3 className="font-label text-lg font-semibold text-neutral-900">Your target</h3>
            <p className="font-body text-sm text-neutral-500">{tierInfo.label} tier</p>
            {roundBest && (
              <p className="font-body mt-1 text-sm text-neutral-600">
                Best round: <span className="text-brand font-semibold">{formatScore(roundBest.score, roundBest.maxScore, drill.scoreDirection)}</span>{" "}
                on {formatRoundBestDate(roundBest.completedAt)}
              </p>
            )}
          </div>
          <p className={`font-display text-5xl leading-none ${TIER_TEXT[tier]}`}>{tierTarget}</p>
        </section>
      </div>

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="bg-brand-dark relative overflow-hidden rounded-3xl p-6 text-center text-white">
            <p className="font-label text-base font-medium text-white/70">You scored</p>
            <p className="font-display text-7xl leading-none">{formatScore(result.score, maxScore, drill.scoreDirection)}</p>
            <p className="font-body mt-2 text-sm text-white/80">
              {isTargetHit(result.score, tierTarget, drill.scoreDirection)
                ? `Target hit. Your ${tierInfo.label} target was ${tierTarget}.`
                : `Target was ${tierTarget}. Keep after it.`}
              {result.lastAttempt !== null && (
                <>
                  {" "}
                  {result.score === result.lastAttempt
                    ? "Same as last time."
                    : isBetterScore(result.score, result.lastAttempt, drill.scoreDirection)
                      ? "Better than last time."
                      : "Below last time."}
                </>
              )}
            </p>
            {result.personalBest !== null && (
              <p className={`font-label mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${result.isNewPersonalBest ? "bg-gold text-brand-dark" : "bg-white/10 text-white/80"}`}>
                {result.isNewPersonalBest
                  ? "New personal best"
                  : `Personal best: ${formatScore(result.personalBest, maxScore, drill.scoreDirection)}`}
              </p>
            )}
          </div>

          {result.rank > 0 &&
            (result.leaderboardHref ? (
              <Link
                to={result.leaderboardHref}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] active:bg-neutral-50"
              >
                <div className="bg-gold/15 flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                  <TrophyIcon className="text-gold h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label text-lg leading-tight font-semibold">{result.rankLabel}</p>
                  <p className="font-body text-sm text-neutral-500">{result.rankSublabel}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 flex-none text-neutral-300" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
                <div className="bg-gold/15 flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                  <TrophyIcon className="text-gold h-6 w-6" />
                </div>
                <div>
                  <p className="font-label text-lg leading-tight font-semibold">{result.rankLabel}</p>
                  <p className="font-body text-sm text-neutral-500">{result.rankSublabel}</p>
                </div>
              </div>
            ))}
        </div>
      ) : pinnedForm ? (
        // Pinned just above the tab bar so logging a score never needs a
        // scroll -- you're on the range with a club in one hand.
        <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 border-t border-black/[0.06] bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-md px-4 py-3">
            {error && <p className="font-body mb-2 text-sm text-red-600">{error}</p>}
            {scoreForm}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
          <p className="font-label mb-2 text-lg font-semibold">Log your score</p>
          {error && <p className="font-body mb-2 text-sm text-red-600">{error}</p>}
          {scoreForm}
        </div>
      )}
    </div>
  );
}
