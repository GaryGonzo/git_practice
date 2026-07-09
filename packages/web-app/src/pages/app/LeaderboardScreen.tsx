import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { HANDICAP_TIERS, TIER_INFO, CATEGORY_INFO, type HandicapTier, type Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { getDrillForDate, getTierLeaderboard, type LeaderboardEntry } from "../../lib/golfableApi";

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

  const [tier, setTier] = useState<HandicapTier>(profile?.tier ?? "mid");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!drillId || !date) return;
    (async () => {
      setLoading(true);
      const [found, board] = await Promise.all([getDrillForDate(date), getTierLeaderboard(drillId, tier, date)]);
      setDrill(found?.drill ?? null);
      setEntries(board);
      setLoading(false);
    })();
  }, [drillId, date, tier]);

  if (!drillId || !date) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Leaderboard</h1>
      <p className="font-body text-sm text-neutral-500">
        {drill ? `${drill.name} · ${CATEGORY_INFO[drill.category].label}` : " "} &middot; {formatDate(date)}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {HANDICAP_TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(t)}
            className={`font-label rounded-md border px-2 py-2 text-sm font-semibold ${
              tier === t ? `${TIER_BG[t]} border-transparent text-white` : "border-neutral-300 text-neutral-600"
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
          <p className="font-body text-sm text-neutral-500">No scores logged in {TIER_INFO[tier].label} yet today.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.username === profile?.username;
              return (
                <div
                  key={entry.username}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 ${
                    isMe ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"
                  }`}
                >
                  <div
                    className={`font-display flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm ${
                      rank <= 3 ? `${TIER_BG[tier]} text-white` : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {rank}
                  </div>
                  <p className="font-label min-w-0 flex-1 truncate text-sm font-semibold">
                    {entry.username}
                    {isMe && <span className="text-brand"> (you)</span>}
                  </p>
                  <span className={`font-label flex-none rounded-full px-3 py-1 text-sm font-semibold ${TIER_TEXT[tier]} bg-neutral-100`}>
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
