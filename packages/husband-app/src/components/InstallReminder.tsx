import { useState } from "react";
import { isPushSupported, isRunningStandalone } from "../lib/push";

interface Props {
  pushEnabled: boolean;
  pushBusy: boolean;
  pushError: string | null;
  onEnablePush: () => void;
}

// Unlike SectionIntro, this has no permanent "seen it" flag -- it should
// reappear every time the Profile screen is visited from a regular browser
// tab, and only stop for good once the app is actually running from the
// home screen icon. "Remind me later" just closes it for this one visit.
export function InstallReminder({ pushEnabled, pushBusy, pushError, onEnablePush }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (isRunningStandalone() || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center sm:rounded-3xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <p className="text-4xl">📲</p>
        <p className="font-display mt-3 text-xl font-semibold">Add this to your Home Screen</p>
        <p className="font-body mt-2 text-sm text-neutral-600">
          You're in a browser tab right now. Add the app to your Home Screen so it opens full-screen like a real
          app -- and so notifications can actually reach you.
        </p>

        <div className="font-body mt-4 space-y-2 rounded-xl bg-neutral-50 p-3 text-left text-xs text-neutral-600">
          <p>
            <span className="font-semibold">iPhone:</span> tap the Share icon, then "Add to Home Screen."
          </p>
          <p>
            <span className="font-semibold">Android:</span> tap the ⋮ menu, then "Add to Home screen" (or "Install
            app").
          </p>
        </div>

        {isPushSupported() && !pushEnabled && (
          <button
            type="button"
            onClick={onEnablePush}
            disabled={pushBusy}
            className="font-display bg-brand mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pushBusy ? "Working…" : "🔔 Also turn on notifications"}
          </button>
        )}
        {pushError && <p className="font-body mt-2 text-xs text-red-600">{pushError}</p>}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="font-display mt-3 w-full rounded-full bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-600"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}
