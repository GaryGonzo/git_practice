import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  deleteClubDistance,
  getClubDistances,
  logClubDistances,
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

const SWINGS_PER_SESSION = 5;
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

interface SwingWizardProps {
  club: string;
  onCancel: () => void;
  onDone: (distances: number[]) => Promise<void>;
}

function SwingWizard({ club, onCancel, onDone }: SwingWizardProps) {
  const [swings, setSwings] = useState<(number | null)[]>(Array(SWINGS_PER_SESSION).fill(null));
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === SWINGS_PER_SESSION - 1;

  async function handleNext() {
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0 || value >= 400) {
      setError("Enter a distance between 1 and 399 yards.");
      return;
    }
    setError(null);
    const next = [...swings];
    next[step] = value;
    setSwings(next);

    if (isLastStep) {
      setSaving(true);
      try {
        await onDone(next.filter((d): d is number => d !== null));
      } catch {
        setError("Couldn't save these swings -- try again.");
        setSaving(false);
      }
      return;
    }

    setStep((s) => s + 1);
    setInput("");
  }

  const averageSoFar = swings.slice(0, step).filter((d): d is number => d !== null);
  const runningAvg =
    averageSoFar.length > 0 ? Math.round(averageSoFar.reduce((s, d) => s + d, 0) / averageSoFar.length) : null;

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          {club} -- Swing {step + 1} of {SWINGS_PER_SESSION}
        </p>
        <button type="button" onClick={onCancel} className="font-label text-xs font-semibold text-neutral-400">
          Cancel
        </button>
      </div>

      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: SWINGS_PER_SESSION }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-neutral-200"}`} />
        ))}
      </div>

      <input
        type="number"
        inputMode="numeric"
        autoFocus
        placeholder="Yards"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="font-display mt-4 w-full rounded-md border border-neutral-300 px-3 py-3 text-center text-3xl"
      />
      {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
      {runningAvg !== null && (
        <p className="font-body mt-2 text-center text-xs text-neutral-500">Average so far: {runningAvg} yd</p>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={saving || !input}
        className="font-label bg-brand mt-4 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : isLastStep ? "Finish" : "Next Swing"}
      </button>
    </div>
  );
}

export function GappingScreen() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<ClubDistanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState(CLUBS[0]);
  const [inWizard, setInWizard] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      setEntries(await getClubDistances(profile.id));
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  async function handleWizardDone(distances: number[]) {
    await logClubDistances(profile!.id, club, distances);
    setEntries(await getClubDistances(profile!.id));
    setInWizard(false);
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
        Hit {SWINGS_PER_SESSION} balls with a club and log each distance -- we'll track your average and fold in
        every session you run.
      </p>

      {inWizard ? (
        <SwingWizard club={club} onCancel={() => setInWizard(false)} onDone={handleWizardDone} />
      ) : (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Club</p>
          <select
            value={club}
            onChange={(e) => setClub(e.target.value)}
            className="font-body mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {CLUBS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setInWizard(true)}
            className="font-label bg-brand mt-3 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white"
          >
            Start {SWINGS_PER_SESSION}-Swing Session
          </button>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Your Gapping
        </h2>
        {loading ? (
          <p className="font-body text-sm text-neutral-500">Loading…</p>
        ) : summaries.length === 0 ? (
          <p className="font-body text-sm text-neutral-500">Run a session to see your gapping chart.</p>
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
