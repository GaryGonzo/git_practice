import { useState } from "react";
import { isPushSupported, subscribeToPush } from "../lib/push";

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Welcome to your household",
    body: "This is your shared space for requests, tasks, notes, and points. Here's a 60-second tour of what's where.",
  },
  {
    emoji: "☕",
    title: "Requests",
    body: "Send a quick ask -- coffee, breakfast in bed, a lit candle -- or type your own with a note for exactly how you want it.",
  },
  {
    emoji: "✅",
    title: "Honey-do tasks",
    body: "Assign chores with points attached. Whoever it's assigned to can start it, finish it, or decline it (with a reason, if they want).",
  },
  {
    emoji: "📊",
    title: "The Board",
    body: "Right on the home screen, you'll both see how many things are pending, in progress, done, and declined -- so patterns are easy to spot.",
  },
  {
    emoji: "🎁",
    title: "Rewards",
    body: "Points add up toward rewards you both set up together -- anything from \"make a sandwich\" to something a lot more playful.",
  },
];

const NOTIF_STEP = {
  emoji: "🚨",
  title: "Don't miss a thing!",
  body: "This is the big one. Turn on notifications so you feel it the second a request lands or points get redeemed -- not whenever you happen to open the app next.",
};

interface Props {
  onDone: () => void;
  memberId: string;
}

export function WelcomeTour({ onDone, memberId }: Props) {
  const [index, setIndex] = useState(0);
  const [pushState, setPushState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pushError, setPushError] = useState<string | null>(null);
  const totalSteps = STEPS.length + 1;
  const isNotifStep = index === STEPS.length;
  const isLast = index === totalSteps - 1;
  const step = isNotifStep ? NOTIF_STEP : STEPS[index];

  async function handleEnableNotifications() {
    setPushState("loading");
    setPushError(null);
    try {
      await subscribeToPush(memberId);
      setPushState("success");
    } catch (err) {
      setPushState("error");
      setPushError(
        err instanceof Error
          ? err.message
          : "Couldn't turn on notifications. If you're on an iPhone, add this to your Home Screen first (Share → Add to Home Screen), then try again from Profile."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === index ? "bg-brand" : "bg-neutral-200"}`}
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-4xl">{step.emoji}</p>
          <p className="font-display mt-3 text-xl font-semibold">{step.title}</p>
          <p className="font-body mt-2 text-sm text-neutral-600">{step.body}</p>
        </div>

        {isNotifStep && (
          <div className="mt-4">
            {pushState === "success" ? (
              <p className="font-display rounded-xl bg-green-50 px-3 py-2.5 text-center text-sm font-semibold text-green-700">
                🎉 Notifications are on -- you're all set.
              </p>
            ) : isPushSupported() ? (
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={pushState === "loading"}
                className="font-display bg-brand w-full rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pushState === "loading" ? "Turning on…" : "🔔 Turn on notifications"}
              </button>
            ) : (
              <p className="font-body rounded-xl bg-amber-50 px-3 py-2.5 text-center text-xs text-amber-800">
                On an iPhone, add this app to your Home Screen first (Share → Add to Home Screen), then come back
                to Profile to turn notifications on.
              </p>
            )}
            {pushState === "error" && pushError && (
              <p className="font-body mt-2 text-center text-xs text-red-600">{pushError}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {!isLast && (
            <button
              type="button"
              onClick={onDone}
              className="font-display flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-600"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? onDone() : setIndex((i) => i + 1))}
            className="font-display bg-brand flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white"
          >
            {isLast ? "Let's go" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
