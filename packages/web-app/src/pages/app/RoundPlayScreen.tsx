import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getRound,
  getRoundHoles,
  updateRoundHole,
  finishRound,
  abandonRound,
  computeRoundStats,
  type Round,
  type RoundHole,
  type RoundHoleUpdate,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="font-label flex h-9 w-9 flex-none items-center justify-center rounded-full border border-neutral-300 text-lg font-semibold text-neutral-600 disabled:opacity-40"
      >
        −
      </button>
      <span className="font-display w-8 text-center text-2xl">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="font-label flex h-9 w-9 flex-none items-center justify-center rounded-full border border-neutral-300 text-lg font-semibold text-neutral-600 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function ToggleGroup({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
          value === true ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
        }`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
          value === false ? "border-neutral-500 bg-neutral-500 text-white" : "border-neutral-300 text-neutral-600"
        }`}
      >
        {noLabel}
      </button>
    </div>
  );
}

export function RoundPlayScreen() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [round, setRound] = useState<Round | null | undefined>(undefined);
  const [holes, setHoles] = useState<RoundHole[]>([]);
  const [holeIndex, setHoleIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!roundId) return;
    (async () => {
      const [roundResult, holesResult] = await Promise.all([getRound(roundId), getRoundHoles(roundId)]);
      setRound(roundResult);
      setHoles(holesResult);
      // Land on the first not-yet-scored hole, so resuming a round picks up
      // where it left off instead of always starting back at hole 1.
      const firstUnscored = holesResult.findIndex((h) => h.score === null);
      setHoleIndex(firstUnscored === -1 ? 0 : firstUnscored);
    })();
  }, [roundId]);

  if (round === undefined) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (round === null) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">That round doesn't exist, or you don't have access to it.</p>
        <Link to="/app/round" className="font-label text-brand mt-4 inline-block text-sm font-semibold underline">
          Back to Round Tracker
        </Link>
      </div>
    );
  }

  const stats = computeRoundStats(holes);

  async function handleFinish() {
    if (!round) return;
    setFinishing(true);
    await finishRound(round.id);
    setRound({ ...round, completedAt: new Date().toISOString() });
    setFinishing(false);
  }

  async function handleAbandon() {
    if (!round) return;
    if (!window.confirm("Discard this round? This can't be undone.")) return;
    await abandonRound(round.id);
    navigate("/app/round");
  }

  function patchHole(holeId: string, updates: RoundHoleUpdate) {
    setHoles((prev) => prev.map((h) => (h.id === holeId ? { ...h, ...toLocalPatch(updates) } : h)));
    updateRoundHole(holeId, updates);
  }

  function toLocalPatch(updates: RoundHoleUpdate): Partial<RoundHole> {
    const patch: Partial<RoundHole> = {};
    if (updates.par !== undefined) patch.par = updates.par;
    if (updates.score !== undefined) patch.score = updates.score;
    if (updates.fairwayHit !== undefined) patch.fairwayHit = updates.fairwayHit;
    if (updates.greenInRegulation !== undefined) patch.greenInRegulation = updates.greenInRegulation;
    if (updates.putts !== undefined) patch.putts = updates.putts;
    if (updates.penaltyStrokes !== undefined) patch.penaltyStrokes = updates.penaltyStrokes;
    return patch;
  }

  // --- Completed round: read-only summary ---
  if (round.completedAt) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        <Link to="/app/round" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
          <BackIcon className="h-4 w-4" />
          Back to Round Tracker
        </Link>

        <h1 className="font-display mt-3 text-2xl tracking-wide">
          {round.holeCount}-Hole Round
        </h1>
        <p className="font-body text-sm text-neutral-500">{formatDate(round.completedAt)}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-3xl">{stats.totalScore}</p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Score ({scoreToParLabel(stats.scoreToPar)})
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-3xl">{stats.totalPutts}</p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Total Putts</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-3xl">
              {stats.girOpportunities > 0 ? `${stats.girHit}/${stats.girOpportunities}` : "--"}
            </p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Greens in Regulation
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-3xl">
              {stats.firOpportunities > 0 ? `${stats.firHit}/${stats.firOpportunities}` : "--"}
            </p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Fairways Hit
            </p>
          </div>
          <div className="col-span-2 rounded-lg border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-3xl">{stats.totalPenalties}</p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Penalty Strokes
            </p>
          </div>
        </div>

        <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Scorecard
        </h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="font-body w-full text-center text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="px-2 py-2 text-left">Hole</th>
                <th className="px-2 py-2">Par</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">FIR</th>
                <th className="px-2 py-2">GIR</th>
                <th className="px-2 py-2">Putts</th>
                <th className="px-2 py-2">Pen.</th>
              </tr>
            </thead>
            <tbody>
              {holes.map((hole) => (
                <tr key={hole.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-2 py-1.5 text-left font-semibold">{hole.holeNumber}</td>
                  <td className="px-2 py-1.5">{hole.par}</td>
                  <td className="px-2 py-1.5">{hole.score ?? "--"}</td>
                  <td className="px-2 py-1.5">{hole.par === 3 ? "--" : hole.fairwayHit === null ? "--" : hole.fairwayHit ? "✓" : "✕"}</td>
                  <td className="px-2 py-1.5">{hole.greenInRegulation === null ? "--" : hole.greenInRegulation ? "✓" : "✕"}</td>
                  <td className="px-2 py-1.5">{hole.putts ?? "--"}</td>
                  <td className="px-2 py-1.5">{hole.penaltyStrokes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- In-progress round: live editor ---
  const hole = holes[holeIndex];
  if (!hole) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <Link to="/app/round" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
          <BackIcon className="h-4 w-4" />
          Round Tracker
        </Link>
        <button type="button" onClick={handleAbandon} className="font-label text-xs font-semibold text-neutral-400 underline">
          Discard round
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-brand px-4 py-3 text-white">
        <div>
          <p className="font-label text-xs font-semibold tracking-widest text-white/70 uppercase">
            Thru {holes.filter((h) => h.score !== null).length} of {round.holeCount}
          </p>
          <p className="font-display text-lg">
            {stats.totalScore > 0 ? `${stats.totalScore} (${scoreToParLabel(stats.scoreToPar)})` : "No scores yet"}
          </p>
        </div>
        <p className="font-body text-sm text-white/80">{stats.totalPutts} putts</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setHoleIndex((i) => Math.max(0, i - 1))}
          disabled={holeIndex === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 disabled:opacity-30"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display text-3xl tracking-wide">Hole {hole.holeNumber}</h1>
        <button
          type="button"
          onClick={() => setHoleIndex((i) => Math.min(holes.length - 1, i + 1))}
          disabled={holeIndex === holes.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 disabled:opacity-30"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Par</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {[3, 4, 5, 6].map((par) => (
              <button
                key={par}
                type="button"
                onClick={() => patchHole(hole.id, { par })}
                className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
                  hole.par === par ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                }`}
              >
                {par}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Score</label>
          <Stepper value={hole.score ?? hole.par} min={1} onChange={(value) => patchHole(hole.id, { score: value })} />
        </div>

        {hole.par !== 3 && (
          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Fairway Hit
            </label>
            <div className="mt-1">
              <ToggleGroup
                value={hole.fairwayHit}
                onChange={(value) => patchHole(hole.id, { fairwayHit: value })}
                yesLabel="Hit"
                noLabel="Missed"
              />
            </div>
          </div>
        )}

        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Green in Regulation
          </label>
          <div className="mt-1">
            <ToggleGroup
              value={hole.greenInRegulation}
              onChange={(value) => patchHole(hole.id, { greenInRegulation: value })}
              yesLabel="Hit"
              noLabel="Missed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Putts</label>
          <Stepper value={hole.putts ?? 2} onChange={(value) => patchHole(hole.id, { putts: value })} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Penalty Strokes
          </label>
          <Stepper value={hole.penaltyStrokes} onChange={(value) => patchHole(hole.id, { penaltyStrokes: value })} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleFinish}
        disabled={finishing || !profile}
        className="font-label bg-brand mt-8 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {finishing ? "Finishing…" : "Finish Round"}
      </button>
    </div>
  );
}
