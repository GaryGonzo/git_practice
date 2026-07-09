import type { Drill, HandicapTier } from "@golfable/shared";
import { CATEGORY_INFO, TIER_INFO } from "@golfable/shared";
import { WeeklyGoalRing } from "./WeeklyGoalRing";
import { DrillHeroImage } from "./DrillHeroImage";

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

export interface DrillResult {
  score: number;
  lastAttempt: number | null;
  rank: number;
  rankLabel: string;
  rankSublabel: string;
}

interface DrillFreshViewProps {
  drill: Drill;
  tier: HandicapTier;
  maxScore: number;
  weeklyGoal: number;
  sessionsThisWeek: number;
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
  interactive = true,
  scoreInput = "",
  onScoreInputChange,
  onSubmit,
  submitting = false,
  eyebrow = "Today's Golfable",
  subtitle = "Everyone trains this one today",
  result,
}: DrillFreshViewProps) {
  const category = CATEGORY_INFO[drill.category];
  const tierTarget = drill.targets[tier];
  const tierInfo = TIER_INFO[tier];

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            {eyebrow}
          </p>
          <p className="font-body text-sm text-neutral-500">{subtitle}</p>
        </div>
        <WeeklyGoalRing completed={sessionsThisWeek} goal={weeklyGoal} size={64} />
      </div>

      <DrillHeroImage drillId={drill.id} alt={drill.name} />

      <div className="mb-4 flex items-center gap-2.5">
        <div
          className={`font-display flex h-9 w-9 items-center justify-center rounded-full text-base text-white ${CATEGORY_BG[drill.category]}`}
        >
          {category.badge}
        </div>
        <div>
          <p
            className={`font-label text-sm font-semibold tracking-wide uppercase ${CATEGORY_TEXT[drill.category]}`}
          >
            {category.label}
          </p>
          <h1 className="font-display text-2xl tracking-wide">{drill.name}</h1>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label mb-1 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Setup
        </p>
        <p className="font-body mb-2 text-sm text-neutral-700">{drill.setup.description}</p>
        <ul className="font-body list-inside list-disc text-sm text-neutral-600">
          {drill.setup.equipment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label mb-1 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Rules &amp; Scoring
        </p>
        <p className="font-body mb-2 text-sm text-neutral-700">{drill.rules.description}</p>
        <ul className="font-body list-inside list-disc text-sm text-neutral-600">
          {drill.rules.scoring.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={`mb-6 rounded-lg border-2 bg-white p-4 ${TIER_BORDER[tier]}`}>
        <p className="font-label mb-1 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Your Target &middot; {tierInfo.label}
        </p>
        <p className={`font-display text-4xl ${TIER_TEXT[tier]}`}>{tierTarget}</p>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="bg-brand rounded-lg p-5 text-center text-white">
            <p className="font-label text-sm font-semibold tracking-widest text-white/70 uppercase">
              You scored
            </p>
            <p className="font-display text-5xl">
              {result.score}/{maxScore}
            </p>
            <p className="font-body mt-1 text-sm text-white/80">
              {result.score >= Number(tierTarget.split("/")[0])
                ? `Target hit — ${tierInfo.label} target was ${tierTarget}`
                : `Target was ${tierTarget} — keep after it`}
              {result.lastAttempt !== null && (
                <>
                  {" · "}
                  {result.score > result.lastAttempt
                    ? `up from ${result.lastAttempt} last time`
                    : result.score < result.lastAttempt
                      ? `down from ${result.lastAttempt} last time`
                      : `same as last time`}
                </>
              )}
            </p>
          </div>

          {result.rank > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
              <div className="bg-gold/15 flex h-11 w-11 flex-none items-center justify-center rounded-full">
                <TrophyIcon className="text-gold h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg tracking-wide">{result.rankLabel}</p>
                <p className="font-body text-sm text-neutral-500">{result.rankSublabel}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={interactive ? onSubmit : (event) => event.preventDefault()}
          className="rounded-lg border border-neutral-200 bg-white p-4"
        >
          <label className="font-label mb-2 block text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            Log your score
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={maxScore}
              required={interactive}
              readOnly={!interactive}
              value={scoreInput}
              onChange={(event) => onScoreInputChange?.(event.target.value)}
              placeholder={`0-${maxScore}`}
              className="font-body flex-1 rounded-md border border-neutral-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={!interactive || submitting}
              className="font-label bg-brand rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
