import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getActiveRound,
  getRoundHistory,
  getRoundHoles,
  startRound,
  computeRoundStats,
  type Round,
  type RoundHole,
} from "../../lib/golfableApi";

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function scoreToParLabel(scoreToPar: number): string {
  if (scoreToPar === 0) return "E";
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
}

function HistoryRow({ round }: { round: Round }) {
  const [holes, setHoles] = useState<RoundHole[] | null>(null);

  useEffect(() => {
    getRoundHoles(round.id).then(setHoles);
  }, [round.id]);

  const stats = holes ? computeRoundStats(holes) : null;

  return (
    <Link
      to={`/app/round/${round.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 active:bg-neutral-50"
    >
      <div className="min-w-0">
        <p className="font-label text-sm font-semibold">
          {round.holeCount} Holes · {round.completedAt ? formatDate(round.completedAt) : ""}
        </p>
        <p className="font-body mt-0.5 text-xs text-neutral-500">
          {stats
            ? `Score ${stats.totalScore} (${scoreToParLabel(stats.scoreToPar)}) · ${stats.totalPutts} putts · ${stats.totalPenalties} penalty`
            : "Loading…"}
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 flex-none text-neutral-300" />
    </Link>
  );
}

export function RoundScreen() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeRound, setActiveRound] = useState<Round | null | undefined>(undefined);
  const [history, setHistory] = useState<Round[] | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getActiveRound(profile.id).then(setActiveRound);
    getRoundHistory(profile.id).then(setHistory);
  }, [profile]);

  async function handleStart(holeCount: 9 | 18) {
    if (!profile) return;
    setStarting(true);
    const round = await startRound(profile.id, holeCount);
    navigate(`/app/round/${round.id}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Round Tracker</h1>
      <p className="font-body text-sm text-neutral-500">
        Track score, fairways, greens, putts, and penalties hole by hole -- no course setup needed.
      </p>

      {activeRound === undefined ? (
        <p className="font-body mt-6 text-sm text-neutral-500">Loading…</p>
      ) : activeRound ? (
        <Link
          to={`/app/round/${activeRound.id}`}
          className="mt-4 flex items-center justify-between gap-3 rounded-lg border-2 border-brand bg-brand/5 p-4"
        >
          <div>
            <p className="font-label text-sm font-semibold">Round in progress</p>
            <p className="font-body text-xs text-neutral-500">{activeRound.holeCount} holes -- tap to resume</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 flex-none text-brand" />
        </Link>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleStart(18)}
            disabled={starting}
            className="font-label bg-brand rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Start 18 Holes
          </button>
          <button
            type="button"
            onClick={() => handleStart(9)}
            disabled={starting}
            className="font-label rounded-md border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-600 disabled:opacity-60"
          >
            Start 9 Holes
          </button>
        </div>
      )}

      <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        Past Rounds
      </h2>
      {history === null ? (
        <p className="font-body text-sm text-neutral-500">Loading…</p>
      ) : history.length === 0 ? (
        <p className="font-body text-sm text-neutral-500">Finish a round and it'll show up here.</p>
      ) : (
        <div className="space-y-2">
          {history.map((round) => (
            <HistoryRow key={round.id} round={round} />
          ))}
        </div>
      )}
    </div>
  );
}
