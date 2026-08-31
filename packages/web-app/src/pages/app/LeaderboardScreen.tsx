import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { HANDICAP_TIERS, TIER_INFO, CATEGORY_INFO, type HandicapTier, type Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import {
  getDrillForDate,
  getGlobalLeaderboard,
  getStudioLeaderboard,
  getStudioById,
  type LeaderboardEntry,
  type Studio,
} from "../../lib/golfableApi";

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
// list down to just that tier, same as before.
type TierFilter = HandicapTier | "all";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function LeaderboardScreen() {
  const { drillId, date } = useParams();
  const { profile } = useAuth();

  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // A studio member's full leaderboard is their studio's, same scoping as
  // the Home screen's live widget -- everyone else sees the public one.
  useEffect(() => {
    if (!profile?.studio_id) {
      setStudio(null);
      return;
    }
    getStudioById(profile.studio_id).then(setStudio);
  }, [profile?.studio_id]);

  useEffect(() => {
    if (!drillId || !date) return;
    (async () => {
      setLoading(true);
      const found = await getDrillForDate(date);
      setDrill(found?.drill ?? null);
      const direction = found?.drill.scoreDirection;
      const tier = tierFilter === "all" ? undefined : tierFilter;
      const board = studio
        ? await getStudioLeaderboard(studio.id, drillId, date, undefined, direction, tier)
        : await getGlobalLeaderboard(drillId, date, undefined, direction, tier);
      setEntries(board);
      setLoading(false);
    })();
  }, [drillId, date, tierFilter, studio]);

  if (!drillId || !date) return null;

  const topRankBg = tierFilter === "all" ? "bg-gold" : TIER_BG[tierFilter];

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/today" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">{studio ? studio.name : "Golfable"} Leaderboard</h1>
      <p className="font-body text-sm text-neutral-500">
        {drill ? `${drill.name} · ${CATEGORY_INFO[drill.category].label}` : " "} &middot; {formatDate(date)}
      </p>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
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
            No scores logged {tierFilter === "all" ? "" : `in ${TIER_INFO[tierFilter].label} `}yet today.
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
