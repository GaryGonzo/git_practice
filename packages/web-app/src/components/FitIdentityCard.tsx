import { useState } from "react";
import { FIT_IDENTITY_FLAT_DAY_LINE, FIT_IDENTITY_STATEMENT, fitIdentitySubline } from "../lib/fitIdentity";
import { fitBlockWeekNumber, type FitBlock } from "../lib/golfableApi";

// Slim one-line identity card. The subline follows the block (deload,
// benchmark, last week); the flat-day line is one tap away.
export function FitIdentityCard({ block, date }: { block?: FitBlock | null; date?: string }) {
  const [flat, setFlat] = useState(false);
  const week = block ? fitBlockWeekNumber(block, date) : null;
  const phase = block && week !== null ? (block.weeks.find((w) => w.weekNumber === week)?.phase ?? null) : null;
  const subline = flat ? FIT_IDENTITY_FLAT_DAY_LINE : fitIdentitySubline(phase, !!block && week !== null && week === block.weekCount);
  return (
    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white py-1 pr-1 pl-4 ring-1 ring-black/[0.06]">
      <div className="min-w-0 flex-1 py-1.5">
        <p className="font-label truncate text-[0.95rem] font-semibold text-neutral-900" title={FIT_IDENTITY_STATEMENT}>
          My body is my project. Block by block.
        </p>
        <p className="font-body text-sm leading-snug text-neutral-500">{subline}</p>
      </div>
      <button
        type="button"
        onClick={() => setFlat((f) => !f)}
        aria-pressed={flat}
        className="font-label min-h-11 shrink-0 rounded-full bg-neutral-100 px-4 text-sm font-semibold text-neutral-600"
      >
        {flat ? "Back" : "Flat day?"}
      </button>
    </div>
  );
}
