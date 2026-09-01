import { useEffect, useState } from "react";
import { HANDICAP_TIERS, TIER_INFO, type HandicapTier, type Drill } from "@golfable/shared";
import { useAuth } from "../lib/AuthProvider";
import { getGlobalLeaderboard, getStudioLeaderboard, type LeaderboardEntry, type Studio } from "../lib/golfableApi";

const TIER_BG: Record<HandicapTier, string> = {
  scratch: "bg-tier-scratch",
  low: "bg-tier-low",
  mid: "bg-tier-mid",
  high: "bg-tier-high",
};

const TIER_TEXT: Record<HandicapTier, string> = {
  scratch: "text-tier-scratch",
  low: "text-tier-low",
  mid: "text-tier-mid",
  high: "text-tier-high",
};

// "All" is the default view -- every tier ranked together, with each row's
// own tier shown next to their name. Picking a specific tier narrows the
// list down to just that tier.
type TierFilter = HandicapTier | "all";

// The tier-filter buttons + ranked list for one drill on one date --
// shared by the deep-linked single-day screen and every tab of the
// Leaderboard section that shows a board (Today, and each day picked from
// Past 7 Days). Studio-scoped when `studio` is set, public otherwise --
// same split used everywhere else a leaderboard is shown.
export function LeaderboardBoard({
  drill,
  date,
  studio,
}: {
  drill: Drill | null;
  date: string;
  studio: Studio | null;
}) {
  const { profile } = useAuth();
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!drill) return;
    setLoading(true);
    const tier = tierFilter === "all" ? undefined : tierFilter;
    const fetcher = studio
      ? getStudioLeaderboard(studio.id, drill.id, date, undefined, drill.scoreDirection, tier)
      : getGlobalLeaderboard(drill.id, date, undefined, drill.scoreDirection, tier);
    fetcher.then((board) => {
      setEntries(board);
      setLoading(false);
    });
  }, [drill, date, studio, tierFilter]);

  if (!drill) {
    return <p className="font-body text-center text-sm text-neutral-500">Loading…</p>;
  }

  const topRankBg = tierFilter === "all" ? "bg-gold" : TIER_BG[tierFilter];

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        <button
          type="button"
          onClick={() => setTierFilter("all")}
          className={`font-label rounded-md border px-2 py-2 text-sm font-semibold ${
            tierFilter === "all" ? "bg-gold border-transparent text-white" : "border-neutral-300 text-neutral-600"
          }`}
        >
          All
        </button>
        {HANDICAP_TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTierFilter(t)}
            className={`font-label rounded-md border px-2 py-2 text-sm font-semibold ${
              tierFilter === t ? `${TIER_BG[t]} border-transparent text-white` : "border-neutral-300 text-neutral-600"
            }`}
          >
            {TIER_INFO[t].label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="font-body text-center text-sm text-neutral-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="font-body text-sm text-neutral-500">
            No scores logged{tierFilter === "all" ? "" : ` in ${TIER_INFO[tierFilter].label}`} for this day.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.userId === profile?.id;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 ${
                    isMe ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"
                  }`}
                >
                  <div
                    className={`font-display flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm ${
                      rank <= 3 ? `${topRankBg} text-white` : "bg-neutral-100 text-neutral-500"
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
                  <span className={`font-label flex-none rounded-full px-3 py-1 text-sm font-semibold ${TIER_TEXT[entry.tier]} bg-neutral-100`}>
                    {entry.score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
