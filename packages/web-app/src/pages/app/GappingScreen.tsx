import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  deleteClubDistance,
  getClubDistances,
  logClubDistance,
  type ClubDistanceEntry,
} from "../../lib/golfableApi";

// Longest to shortest, matching a typical bag makeup -- keeps club names
// canonical (rather than free text) so averaging and sort order stay
// meaningful across entries.
const CLUBS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "Hybrid",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "PW",
  "GW",
  "SW",
  "LW",
];

const RECENT_LOG_LIMIT = 10;

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .6 9.4a1.5 1.5 0 0 0 1.5 1.4h4.8a1.5 1.5 0 0 0 1.5-1.4L14.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ClubSummary {
  club: string;
  avgYards: number;
  count: number;
}

function summarize(entries: ClubDistanceEntry[]): ClubSummary[] {
  const byClub = new Map<string, number[]>();
  for (const entry of entries) {
    const list = byClub.get(entry.club) ?? [];
    list.push(entry.distanceYards);
    byClub.set(entry.club, list);
  }
  const summaries: ClubSummary[] = [];
  for (const [club, distances] of byClub) {
    const avgYards = Math.round(distances.reduce((sum, d) => sum + d, 0) / distances.length);
    summaries.push({ club, avgYards, count: distances.length });
  }
  return summaries.sort((a, b) => b.avgYards - a.avgYards);
}

export function GappingScreen() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<ClubDistanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState(CLUBS[0]);
  const [distance, setDistance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      setEntries(await getClubDistances(profile.id));
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  async function handleLog(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(distance);
    if (!Number.isFinite(value) || value <= 0 || value >= 400) {
      setError("Enter a distance between 1 and 399 yards.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await logClubDistance(profile!.id, club, value);
      setEntries(await getClubDistances(profile!.id));
      setDistance("");
    } catch {
      setError("Couldn't save that distance -- try again.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteClubDistance(id);
    } catch {
      setEntries(await getClubDistances(profile!.id));
    }
  }

  const summaries = summarize(entries);
  const maxYards = summaries[0]?.avgYards ?? 1;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/tools" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Club Gapping</h1>
      <p className="font-body text-sm text-neutral-500">
        Log carry distances from the range to see your average per club and spot any gaps in the bag.
      </p>

      <form onSubmit={handleLog} className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Log a Distance</p>
        <div className="mt-2 flex gap-2">
          <select
            value={club}
            onChange={(e) => setClub(e.target.value)}
            className="font-body flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {CLUBS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Yards"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="font-body w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || !distance}
          className="font-label bg-brand mt-3 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Log Distance"}
        </button>
      </form>

      <div className="mt-6">
        <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Your Gapping
        </h2>
        {loading ? (
          <p className="font-body text-sm text-neutral-500">Loading…</p>
        ) : summaries.length === 0 ? (
          <p className="font-body text-sm text-neutral-500">Log a few distances to see your gapping chart.</p>
        ) : (
          <div className="space-y-1.5">
            {summaries.map((s) => (
              <div key={s.club} className="flex items-center gap-3">
                <span className="font-label w-16 flex-none truncate text-sm font-semibold">{s.club}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${Math.max((s.avgYards / maxYards) * 100, 6)}%` }}
                  />
                </div>
                <span className="font-label w-14 flex-none text-right text-sm font-semibold text-neutral-600">
                  {s.avgYards} yd
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div className="mt-6">
          <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            Recent Logs
          </h2>
          <div className="space-y-1.5">
            {entries.slice(0, RECENT_LOG_LIMIT).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
              >
                <span className="font-label flex-1 text-sm font-semibold">{entry.club}</span>
                <span className="font-body text-sm text-neutral-500">{entry.distanceYards} yd</span>
                <span className="font-body text-xs text-neutral-400">{formatDate(entry.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
                  className="text-neutral-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
