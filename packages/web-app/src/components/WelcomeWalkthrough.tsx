import { useState, type ComponentType } from "react";
import { GolfableMark } from "./GolfableMark";
import { TodayIcon, ProgressIcon, LibraryIcon, ProfileIcon } from "./AppNav";

interface WalkthroughStep {
  icon: ComponentType<{ className?: string }> | null;
  title: string;
  body: string;
}

const STEPS: WalkthroughStep[] = [
  {
    icon: null,
    title: "Welcome to Golfable",
    body: "Every weekday brings one new drill, shared by everyone training that day. Here's a 30-second look around.",
  },
  {
    icon: TodayIcon,
    title: "Today's Golfable",
    body: "Your daily drill lives here -- see the setup, log your score, and know exactly what to do.",
  },
  {
    icon: ProgressIcon,
    title: "Track Your Progress",
    body: "Watch your trend on drills you repeat and see your weekly goal fill in as you go.",
  },
  {
    icon: LibraryIcon,
    title: "Catch Up Anytime",
    body: "Miss a day? Every past Golfable is saved here and still counts toward your weekly goal.",
  },
  {
    icon: ProfileIcon,
    title: "Make It Yours",
    body: "Adjust your tier, weekly goal, and name anytime from your Profile.",
  },
];

interface WelcomeWalkthroughProps {
  onDone: () => void;
}

export function WelcomeWalkthrough({ onDone }: WelcomeWalkthroughProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="bg-brand/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          {Icon ? <Icon className="text-brand h-8 w-8" /> : <GolfableMark className="h-10 w-10" />}
        </div>
        <h2 className="font-display mt-4 text-2xl tracking-wide">{current.title}</h2>
        <p className="font-body mt-2 text-sm text-neutral-600">{current.body}</p>

        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-brand" : "bg-neutral-200"}`} />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {!isLast && (
            <button
              type="button"
              onClick={onDone}
              className="font-label flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-600"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
            className="font-label bg-brand flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white"
          >
            {isLast ? "Let's go" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
