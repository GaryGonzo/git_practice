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
}: DrillFreshViewProps) {
  const category = CATEGORY_INFO[drill.category];
  const tierTarget = drill.targets[tier];
  const tierInfo = TIER_INFO[tier];

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Today's Golfable
          </p>
          <p className="font-body text-sm text-neutral-500">Everyone trains this one today</p>
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
            className={`font-label text-xs font-semibold tracking-wide uppercase ${CATEGORY_TEXT[drill.category]}`}
          >
            {category.label}
          </p>
          <h1 className="font-display text-2xl tracking-wide">{drill.name}</h1>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label mb-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
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
        <p className="font-label mb-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
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
        <p className="font-label mb-1 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Your Target &middot; {tierInfo.label}
        </p>
        <p className={`font-display text-4xl ${TIER_TEXT[tier]}`}>{tierTarget}</p>
      </div>

      <form
        onSubmit={interactive ? onSubmit : (event) => event.preventDefault()}
        className="rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="font-label mb-2 block text-xs font-semibold tracking-widest text-neutral-500 uppercase">
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
    </div>
  );
}
