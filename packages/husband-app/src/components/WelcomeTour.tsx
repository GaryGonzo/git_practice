import { useState } from "react";

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

interface Props {
  onDone: () => void;
}

export function WelcomeTour({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
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
