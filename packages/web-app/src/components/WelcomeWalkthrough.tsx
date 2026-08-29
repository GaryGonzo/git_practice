import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { GolfableMark } from "./GolfableMark";
import { TodayIcon, ProgressIcon, LibraryIcon, ProfileIcon } from "./AppNav";
import { NotificationPrompt } from "./NotificationPrompt";
import { getStudioById, type Studio } from "../lib/golfableApi";
import type { Profile } from "../lib/AuthProvider";

function ChooseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChallengeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10v3.5a5 5 0 0 1-10 0V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M11 12.3v3.2M12 21h0a3 3 0 0 0 3-3h-6a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 5h3v1.5A3.5 3.5 0 0 1 17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 21V10a5 5 0 0 1 10 0v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 10V4M12 10V3M15 10V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 20V10l8-6 8 6v10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

interface WalkthroughStep {
  icon: ComponentType<{ className?: string }> | null;
  title: string;
  body: string;
  content?: ReactNode;
}

function buildSteps(profile: Profile, studio: Studio | null): WalkthroughStep[] {
  const steps: WalkthroughStep[] = [
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
      icon: ChooseIcon,
      title: "Or Build Your Own",
      body: "Rather pick your own drills? Choose Your Own Golfable lets you play anything in the library, anytime -- it tracks your personal best and counts toward your weekly goal just like the daily drill (one Golfable a day toward that goal, however many you play).",
    },
    {
      icon: ChallengeIcon,
      title: "More Ways to Play",
      body: "Start a Challenge to compete with up to 4 friends on the same drill, or sharpen up with the practice Tools -- metronome, fairway finder, swing tempo, and more.",
    },
    {
      icon: ProgressIcon,
      title: "Track Your Progress",
      body: "Watch your trend on drills you repeat, and check your Golfable Score on Home -- a live score for each category, plus one overall number, built from your last 10 rounds.",
    },
    {
      icon: BagIcon,
      title: "Set Up Your Game",
      body: "Add your handicap and your typical yardage per club in Profile -- unlocks personalized club suggestions and tracks your improvement over time.",
    },
    {
      icon: StarIcon,
      title: "Find Your Next Golfable",
      body: "Rate a Golfable after you play it to build your Favorites, or rate your own game in Profile to get Golfables recommended just for you in Choose Your Own.",
    },
    {
      icon: LibraryIcon,
      title: "Catch Up Anytime",
      body: "Miss a day? Every past Golfable is saved here and still counts toward your weekly goal.",
    },
    {
      icon: null,
      title: "Stay On Track",
      body: "",
      content: <NotificationPrompt profile={profile} />,
    },
  ];

  if (studio) {
    steps.push({
      icon: StudioIcon,
      title: `${studio.name} on Golfable`,
      body: `You're training with ${studio.name} -- your Home screen shows your studio's own private leaderboard instead of the national one.`,
    });

    if (studio.ownerUserId === profile.id) {
      steps.push({
        icon: StudioIcon,
        title: `Manage ${studio.name}`,
        body: "As the studio owner, open Manage Studio from your Profile anytime to share your join link and see every member's activity.",
      });
    }
  }

  steps.push({
    icon: ProfileIcon,
    title: "Make It Yours",
    body: "Adjust your tier, weekly goal, name, and profile photo anytime from your Profile.",
  });

  return steps;
}

interface WelcomeWalkthroughProps {
  profile: Profile;
  onDone: () => void;
}

export function WelcomeWalkthrough({ profile, onDone }: WelcomeWalkthroughProps) {
  // A studio member's (and separately, a studio owner's) steps depend on
  // fetching their studio, so hold off rendering until that's resolved --
  // otherwise the step count/dots would shift under the user mid-walkthrough.
  const [studio, setStudio] = useState<Studio | null | undefined>(profile.studio_id ? undefined : null);

  useEffect(() => {
    if (!profile.studio_id) {
      setStudio(null);
      return;
    }
    getStudioById(profile.studio_id).then(setStudio);
  }, [profile.studio_id]);

  const [step, setStep] = useState(0);

  if (studio === undefined) return null;

  const steps = buildSteps(profile, studio);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="bg-brand/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          {Icon ? <Icon className="text-brand h-8 w-8" /> : <GolfableMark className="h-10 w-10" />}
        </div>
        <h2 className="font-display mt-4 text-2xl tracking-wide">{current.title}</h2>
        {current.content ? (
          <div className="mt-2 text-left">{current.content}</div>
        ) : (
          <p className="font-body mt-2 text-sm text-neutral-600">{current.body}</p>
        )}

        <div className="mt-6 flex justify-center gap-1.5">
          {steps.map((_, i) => (
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
