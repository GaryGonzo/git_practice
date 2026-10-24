import { useState } from "react";
import {
  FIT_IDENTITY_DEFAULT_LINE,
  FIT_IDENTITY_FLAT_DAY_LINE,
  FIT_IDENTITY_STATEMENT,
} from "../lib/fitIdentity";

export function FitIdentityCard() {
  const [flat, setFlat] = useState(false);
  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
      <p className="font-display text-xl leading-snug tracking-wide text-neutral-900">{FIT_IDENTITY_STATEMENT}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm text-neutral-500">{flat ? FIT_IDENTITY_FLAT_DAY_LINE : FIT_IDENTITY_DEFAULT_LINE}</p>
        <button
          type="button"
          onClick={() => setFlat((f) => !f)}
          aria-pressed={flat}
          className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
        >
          {flat ? "Back" : "Flat day?"}
        </button>
      </div>
    </div>
  );
}
