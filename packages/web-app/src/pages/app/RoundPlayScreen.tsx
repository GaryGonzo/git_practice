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
  upAndDownResult,
  type Round,
  type RoundHole,
  type RoundHoleUpdate,
  type FairwayMissSide,
  type GreenMissDirection,
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

const FAIRWAY_MISS_LABELS: Record<FairwayMissSide, string> = { left: "L", right: "R" };

const GREEN_MISS_LABELS: Record<GreenMissDirection, string> = {
  long: "Lo",
  long_right: "Lo-R",
  right: "R",
  short_right: "Sh-R",
  short: "Sh",
  short_left: "Sh-L",
  left: "L",
  long_left: "Lo-L",
};

// Traditional scorecard marks, relative to par -- shape only, no color:
// birdie or better circled, par plain, bogey boxed, double-or-worse
// double-boxed.
function scoreBadgeClass(scoreToPar: number): string {
  if (scoreToPar <= -1) return "rounded-full border border-neutral-700";
  if (scoreToPar === 0) return "";
  if (scoreToPar === 1) return "rounded-none border border-neutral-700";
  return "rounded-none border-4 border-double border-neutral-700";
}

// Putts per hole, colored (this one *does* use color, unlike the score
// marks above): 1-putt green, 2-putt left as the default text color,
// 3-putt-or-worse red.
function puttsColorClass(putts: number): string {
  if (putts <= 1) return "text-green-600";
  if (putts === 2) return "";
  return "text-red-600";
}

function fairwayCellText(hole: RoundHole): string {
  if (hole.par === 3 || hole.fairwayHit === null) return "--";
  if (hole.fairwayHit) return "✓";
  return hole.fairwayMissSide ? FAIRWAY_MISS_LABELS[hole.fairwayMissSide] : "✕";
}

function greenCellText(hole: RoundHole): string {
  if (hole.greenInRegulation === null) return "--";
  if (hole.greenInRegulation) return "✓";
  return hole.greenMissDirection ? GREEN_MISS_LABELS[hole.greenMissDirection] : "✕";
}

function upAndDownCellText(hole: RoundHole): string {
  const result = upAndDownResult(hole);
  if (result === null) return "--";
  return result ? "✓" : "✕";
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

// Left / Hit / Right in a row -- mirrors standing over the ball and missing
// one way or the other, simpler than the green's 8-way miss since there's
// no long/short axis off the tee.
function FairwayControl({
  hit,
  missSide,
  onHit,
  onMiss,
}: {
  hit: boolean | null;
  missSide: FairwayMissSide | null;
  onHit: () => void;
  onMiss: (side: FairwayMissSide) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => onMiss("left")}
        className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
          hit === false && missSide === "left" ? "bg-neutral-700 border-neutral-700 text-white" : "border-neutral-300 text-neutral-600"
        }`}
      >
        Left
      </button>
      <button
        type="button"
        onClick={onHit}
        className={`font-label rounded-md border-2 px-3 py-2 text-sm font-semibold ${
          hit === true ? "bg-brand border-brand text-white" : "border-brand text-brand"
        }`}
      >
        Hit
      </button>
      <button
        type="button"
        onClick={() => onMiss("right")}
        className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
          hit === false && missSide === "right" ? "bg-neutral-700 border-neutral-700 text-white" : "border-neutral-300 text-neutral-600"
        }`}
      >
        Right
      </button>
    </div>
  );
}

const GREEN_GRID: (GreenMissDirection | "hit")[] = [
  "long_left",
  "long",
  "long_right",
  "left",
  "hit",
  "right",
  "short_left",
  "short",
  "short_right",
];

const GREEN_GRID_LABELS: Record<GreenMissDirection, string> = {
  long_left: "Long\nLeft",
  long: "Long",
  long_right: "Long\nRight",
  left: "Left",
  right: "Right",
  short_left: "Short\nLeft",
  short: "Short",
  short_right: "Short\nRight",
};

// 3x3 grid standing in for a green from above -- tap the middle for a hit,
// or whichever direction the miss actually went. Long/short (relative to
// the pin) plus left/right covers all 8 misses a green can take.
function GreenControl({
  hit,
  missDirection,
  onHit,
  onMiss,
}: {
  hit: boolean | null;
  missDirection: GreenMissDirection | null;
  onHit: () => void;
  onMiss: (direction: GreenMissDirection) => void;
}) {
  return (
    <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2">
      {GREEN_GRID.map((cell) => {
        if (cell === "hit") {
          return (
            <button
              key="hit"
              type="button"
              onClick={onHit}
              className={`font-label aspect-square rounded-full border-2 text-xs font-semibold ${
                hit === true ? "bg-brand border-brand text-white" : "border-brand text-brand"
              }`}
            >
              Hit
            </button>
          );
        }
        const active = hit === false && missDirection === cell;
        return (
          <button
            key={cell}
            type="button"
            onClick={() => onMiss(cell)}
            className={`font-label aspect-square rounded-lg border text-xs leading-tight font-semibold whitespace-pre-line ${
              active ? "bg-neutral-700 border-neutral-700 text-white" : "border-neutral-300 text-neutral-600"
            }`}
          >
            {GREEN_GRID_LABELS[cell]}
          </button>
        );
      })}
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
  // Lets a finished round be reopened into the same hole-by-hole editor --
  // separate from round.completedAt so re-editing doesn't require (or
  // trigger) finishing it again.
  const [forceEditor, setForceEditor] = useState(false);

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
  const isEditingCompleted = Boolean(round.completedAt) && forceEditor;

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
    if (updates.fairwayMissSide !== undefined) patch.fairwayMissSide = updates.fairwayMissSide;
    if (updates.greenInRegulation !== undefined) patch.greenInRegulation = updates.greenInRegulation;
    if (updates.greenMissDirection !== undefined) patch.greenMissDirection = updates.greenMissDirection;
    if (updates.putts !== undefined) patch.putts = updates.putts;
    if (updates.penaltyStrokes !== undefined) patch.penaltyStrokes = updates.penaltyStrokes;
    return patch;
  }

  // --- Completed round: read-only summary (unless reopened for editing) ---
  if (round.completedAt && !forceEditor) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <Link to="/app/round" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
            <BackIcon className="h-4 w-4" />
            Back to Round Tracker
          </Link>
          <button
            type="button"
            onClick={() => {
              setHoleIndex(0);
              setForceEditor(true);
            }}
            className="font-label text-brand flex-none text-xs font-semibold underline"
          >
            Edit Round
          </button>
        </div>

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
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-3xl">
              {stats.upAndDownOpportunities > 0 ? `${stats.upAndDownHit}/${stats.upAndDownOpportunities}` : "--"}
            </p>
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Up &amp; Down</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
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
                <th className="px-2 py-2">U&amp;D</th>
                <th className="px-2 py-2">Putts</th>
                <th className="px-2 py-2">Pen.</th>
              </tr>
            </thead>
            <tbody>
              {holes.map((hole) => (
                <tr key={hole.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-2 py-1.5 text-left font-semibold">{hole.holeNumber}</td>
                  <td className="px-2 py-1.5">{hole.par}</td>
                  <td className="px-2 py-1.5">
                    {hole.score === null ? (
                      "--"
                    ) : (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center font-semibold ${scoreBadgeClass(hole.score - hole.par)}`}
                      >
                        {hole.score}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">{fairwayCellText(hole)}</td>
                  <td className="px-2 py-1.5">{greenCellText(hole)}</td>
                  <td className="px-2 py-1.5">{upAndDownCellText(hole)}</td>
                  <td className={`px-2 py-1.5 font-semibold ${hole.putts !== null ? puttsColorClass(hole.putts) : ""}`}>
                    {hole.putts ?? "--"}
                  </td>
                  <td className="px-2 py-1.5">{hole.penaltyStrokes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- Live editor: a fresh round in progress, or a completed one reopened ---
  const hole = holes[holeIndex];
  if (!hole) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  const isLastHole = holeIndex === holes.length - 1;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        {isEditingCompleted ? (
          <button
            type="button"
            onClick={() => setForceEditor(false)}
            className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500"
          >
            <BackIcon className="h-4 w-4" />
            Back to Summary
          </button>
        ) : (
          <Link to="/app/round" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
            <BackIcon className="h-4 w-4" />
            Round Tracker
          </Link>
        )}
        {!isEditingCompleted && (
          <button type="button" onClick={handleAbandon} className="font-label text-xs font-semibold text-neutral-400 underline">
            Discard round
          </button>
        )}
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
          disabled={isLastHole}
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
              Fairway
            </label>
            <div className="mt-1">
              <FairwayControl
                hit={hole.fairwayHit}
                missSide={hole.fairwayMissSide}
                onHit={() => patchHole(hole.id, { fairwayHit: true, fairwayMissSide: null })}
                onMiss={(side) => patchHole(hole.id, { fairwayHit: false, fairwayMissSide: side })}
              />
            </div>
          </div>
        )}

        <div>
          <label className="font-label block text-center text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Green
          </label>
          <div className="mt-1">
            <GreenControl
              hit={hole.greenInRegulation}
              missDirection={hole.greenMissDirection}
              onHit={() => patchHole(hole.id, { greenInRegulation: true, greenMissDirection: null })}
              onMiss={(direction) => patchHole(hole.id, { greenInRegulation: false, greenMissDirection: direction })}
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

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setHoleIndex((i) => Math.min(holes.length - 1, i + 1))}
          disabled={isLastHole}
          className="font-label bg-brand flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Next Hole
        </button>
        {isEditingCompleted ? (
          <button
            type="button"
            onClick={() => setForceEditor(false)}
            className="font-label flex-none rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-600"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishing || !profile}
            className="font-label flex-none rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {finishing ? "Finishing…" : "Finish Round"}
          </button>
        )}
      </div>
    </div>
  );
}
