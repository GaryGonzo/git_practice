import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Drill } from "@golfable/shared";
import {
  SKILL_CATEGORIES,
  CATEGORY_INFO,
  HANDICAP_TIERS,
  TIER_INFO,
  CAPTION_HASHTAGS,
} from "@golfable/shared";
import { GolfableMark } from "../components/GolfableMark";
import { DrillFreshView } from "../components/DrillFreshView";
import { CategoryIcon } from "../components/CategoryIcon";
import { FOUNDER_SPOTS, getFounderSpotsRemaining } from "../lib/golfableApi";

// Once fewer than this fraction of founder spots remain, swap the generic
// banner for a live countdown -- the scarcity reads as more real once it's
// closer to true.
const COUNTDOWN_THRESHOLD = 0.3;

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

const CATEGORY_TEXT: Record<string, string> = {
  driver: "text-driver",
  irons: "text-irons",
  wedges: "text-wedges",
  putter: "text-putter",
};

const TIER_BORDER: Record<string, string> = {
  scratch: "border-tier-scratch",
  low: "border-tier-low",
  mid: "border-tier-mid",
  high: "border-tier-high",
};

const TIER_TEXT: Record<string, string> = {
  scratch: "text-tier-scratch",
  low: "text-tier-low",
  mid: "text-tier-mid",
  high: "text-tier-high",
};

const CATEGORY_DETAIL: Record<string, { description: string; schedule: string }> = {
  driver: {
    description: "Tee shots and fairway woods — swinging for distance and finding fairways.",
    schedule: "Every Monday",
  },
  irons: {
    description: "Approach play — flighting the ball into greens from the fairway.",
    schedule: "Rotates with Wedges on Tue, Thu & Fri",
  },
  wedges: {
    description: "Short game — chips, pitches, and bunker shots inside 100 yards.",
    schedule: "Rotates with Irons on Tue, Thu & Fri",
  },
  putter: {
    description: "Putting — speed control and reading greens before you tee off.",
    schedule: "Every Wednesday",
  },
};

const TIER_DETAIL: Record<string, { description: string }> = {
  scratch: {
    description:
      "Longer distances, tighter fairways, short-sided greens — the same margin for error a plus-handicap actually plays with.",
  },
  low: {
    description: "Less room to miss and tighter windows to hit. Built for a game that's already dialed in.",
  },
  mid: {
    description:
      "A real test without punishing you for it — enough margin to succeed, enough precision to keep sharpening.",
  },
  high: {
    description:
      "The most forgiving targets on the board, built to be fun from your very first swing — hard enough to build real skills as you go.",
  },
};

const SNEAK_PEEK_DRILLS: { drill: Drill; maxScore: number }[] = [
  {
    drill: {
      id: "fairway-finder",
      name: "Fairway Finder",
      category: "driver",
      setup: {
        equipment: ["Driver", "10 golf balls"],
        description:
          "On the driving range, mark out an imaginary fairway that's 30 yards wide. Hit 10 drives, aiming to find the short grass every time.",
      },
      rules: {
        description:
          "Play 10 tee shots with your driver. No mulligans, no provisional re-hits — the first swing counts.",
        scoring: [
          "1 point per drive that finishes in the fairway",
          "Rough, bunkers, and hazards don't count",
          "10 drives total",
        ],
      },
      targets: { scratch: "8/10", low: "6/10", mid: "4/10", high: "2/10" },
    },
    maxScore: 10,
  },
  {
    drill: {
      id: "the-gate",
      name: "The Gate",
      category: "putter",
      setup: {
        equipment: ["Putter", "4 tees", "10 golf balls"],
        description:
          "Push two tees into the green just wider than your putter head, right next to the ball, forming a putter gate. Push two more tees into the green just wider than the ball, about 6 inches in front of it, forming a ball gate. Putt 10 balls from 6 feet, clearing both gates cleanly. Play 3 rounds and record your best score of the 3.",
      },
      rules: {
        description:
          "Play 10 putts from 6 feet, each one required to pass cleanly through both gates on its way to the hole.",
        scoring: [
          "1 point per made putt that passes through both gates without touching the tees",
          "Play 3 rounds; record your best score of the 3",
          "10 putts per round",
        ],
      },
      targets: { scratch: "9/10", low: "7/10", mid: "5/10", high: "3/10" },
    },
    maxScore: 10,
  },
];

// Fades + rises each section into view the first time it crosses into the
// viewport -- gives the page a sense of motion when scrolling instead of
// everything just being present at once.
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// A short, high-contrast CTA moment dropped between content sections so a
// join button is never more than a couple sections away on the scroll.
function CtaBand({ heading, tone = "brand" }: { heading: string; tone?: "brand" | "brand-dark" }) {
  return (
    <section className={tone === "brand" ? "bg-brand px-6 py-14 text-center" : "bg-brand-dark px-6 py-14 text-center"}>
      <Reveal className="mx-auto max-w-lg">
        <h3 className="font-display text-2xl tracking-wide text-white sm:text-3xl">{heading}</h3>
        <Link
          to="/signup"
          className="font-label bg-gold text-brand-dark mt-5 inline-block rounded-md px-7 py-3.5 text-sm font-semibold shadow-lg"
        >
          Join free — no card required
        </Link>
      </Reveal>
    </section>
  );
}

function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <div className="flex justify-center">
      <span
        className={`font-label inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase ${
          tone === "dark" ? "bg-white/10 text-white" : "border-brand/15 bg-brand/5 text-brand border"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "One shared Golfable, every day",
    body: "Everyone training that day — your buddies, your club, golfers around the world — gets the exact same drill. Same setup, same rules, same target.",
  },
  {
    step: "2",
    title: "Scored to your handicap tier",
    body: "Targets are set for Scratch+, Low, Mid, and High separately, so the challenge is calibrated to your game, not a stranger's.",
  },
  {
    step: "3",
    title: "Log it, track it, climb the board",
    body: "Log your score in seconds. Watch your trend on drills you repeat, hit your weekly practice goal, and see where you land on today's leaderboard.",
  },
];

const FRICTIONLESS = [
  {
    title: "Same clubs, same balls",
    body: "No new equipment. Bring exactly what you already take to the range or course.",
  },
  {
    title: "Same amount of time",
    body: "A Golfable takes minutes -- it's not an extra practice session, it's the one you're already doing.",
  },
  {
    title: "Same swing",
    body: "We don't touch your mechanics. Just the same reps you already hit, now with a score attached.",
  },
];

const FAQS = [
  {
    question: "What is Golfable?",
    answer:
      "A daily golf skill challenge. Every weekday, every golfer trains the exact same drill -- you play it, log your score, and see how you compare to others in your handicap tier.",
  },
  {
    question: "Do you teach swing technique?",
    answer:
      "No. Golfable isn't swing instruction -- we don't teach mechanics or give swing tips. We build structured, scored practice sessions that change how you train, not your swing, so the improvement is real and it actually sticks.",
  },
  {
    question: "Is it free?",
    answer: "Yes. Golfable is free forever for our first 100 founding members -- no credit card required.",
  },
  {
    question: "What do I need to play?",
    answer:
      "Just your own clubs and balls, wherever you already practice -- a range, a course, or your backyard. Each Golfable tells you exactly what's needed.",
  },
  {
    question: "How does my handicap tier work?",
    answer:
      "When you sign up, you pick the tier that matches your game -- Scratch+, Low, Mid, or High. Every drill has different targets for each tier, so you're always chasing a number that fits you, not a stranger.",
  },
  {
    question: "What happens if I miss a day?",
    answer:
      "No pressure. Head to your Library to catch up on any past Golfable and still count it toward your weekly goal.",
  },
  {
    question: "Do I have to play the daily Golfable?",
    answer:
      "Nope. Today's Golfable is there if you want to follow the program, but you can also use Choose Your Own Golfable to pick any drill in the library, any time. Either way it tracks your personal best and counts toward your weekly goal.",
  },
  {
    question: "Can I compete with my friends?",
    answer:
      "Yes -- Challenge a Friend lets you pick any drill, share a join code, and compete with up to 4 friends on a live-updating scoreboard. Changed your mind? You can cancel a challenge anytime before anyone joins. You can add an optional wager too, just for fun -- no real money changes hands.",
  },
  {
    question: "What is my Golfable Score?",
    answer:
      "A live score for each of the four skill categories, plus one overall number, built from your 10 most recent rounds in that category. Tap any score on your Home screen to see exactly which rounds make it up and how it's calculated.",
  },
  {
    question: "What is My Bag?",
    answer:
      "Log your typical yardage for every club except your putter, and any drill that calls for a target distance will suggest the club from your bag that matches it best.",
  },
  {
    question: "Can Golfable track my handicap?",
    answer:
      "Yes. Log your handicap index or your average score on a par-72 once a month, and Profile shows a trend line plus how much you've moved since your first entry.",
  },
  {
    question: "How do Favorites and recommendations work?",
    answer:
      "Rate a Golfable after you play it to build your Favorites and see what's popular with the community. Rate your own game by category in Profile, and Choose Your Own Golfable will recommend drills built for your weakest area.",
  },
  {
    question: "What are the Training Tools?",
    answer:
      "A free set of practice aids built into the app: a swing-tempo metronome, a camera-based fairway finder and alignment checker, a green-slope reader, a swing tempo tracker, and club gapping to log your average carry distance per club.",
  },
  {
    question: "Do I need to be a good golfer to play?",
    answer:
      "Not at all. Every tier -- including High -- gets its own realistic targets, so beginners get just as much out of it as scratch players.",
  },
];

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10v3.5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 5h3v1.5A3.5 3.5 0 0 1 17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 12.5V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 20h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.5 16.5h5l.8 3.5h-6.6l.8-3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`${className} transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 13.8l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </svg>
  );
}

function ClockRewindIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 16l5-5 3 3 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BadgeCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 13.5L7.5 20l4.5-2.2 4.5 2.2-1.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 9l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
        d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13v3m-3 4h6m-3-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetronomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 20h8l-2.2-14h-3.6L8 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.5 9.5 15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FairwayFinderToolIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20 10 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 20 14 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GreenReaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="9" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SwingTempoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21a8.5 8.5 0 1 0-6-14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlignmentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 3.5" />
    </svg>
  );
}

function GappingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 20V10M11 20V6M17 20v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BagFeatureIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 21V10a5 5 0 0 1 10 0v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 10V4M12 10V3M15 10V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HandicapGaugeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 16a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 16l4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ScoreRingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 4a8 8 0 0 1 6.9 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function RatingStarIcon({ className }: { className?: string }) {
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

const NEW_FEATURES: { icon: ComponentType<{ className?: string }>; title: string; body: string }[] = [
  {
    icon: BagFeatureIcon,
    title: "My Bag",
    body: "Log your average yardage per club and Golfable calls the right club for any target distance, right on the drill.",
  },
  {
    icon: HandicapGaugeIcon,
    title: "Handicap Tracking",
    body: "Log your handicap or average score once a month and watch the trend line move as your game improves.",
  },
  {
    icon: ScoreRingIcon,
    title: "Golfable Score",
    body: "One live score per category, plus an overall number, built from your 10 most recent rounds. Tap any score to see exactly how it's calculated.",
  },
  {
    icon: RatingStarIcon,
    title: "Recommended For You",
    body: "Rate Golfables to build your Favorites and see Community Favorites, or rate your own game to get drills recommended for your weakest category.",
  },
];

const TRAINING_TOOLS: { icon: ComponentType<{ className?: string }>; name: string; body: string }[] = [
  {
    icon: MetronomeIcon,
    name: "Metronome",
    body: "Dial in a consistent swing tempo with adjustable BPM.",
  },
  {
    icon: FairwayFinderToolIcon,
    name: "Fairway Finder",
    body: "Point your camera downrange and see boundary lines for any fairway width.",
  },
  {
    icon: GreenReaderIcon,
    name: "Green Reader",
    body: "Lay your phone flat on the green to read its slope.",
  },
  {
    icon: SwingTempoIcon,
    name: "Swing Tempo",
    body: "Measure your backswing-to-downswing ratio against the tour-average 3:1.",
  },
  {
    icon: AlignmentIcon,
    name: "Alignment Checker",
    body: "Prop your camera down the target line and check your setup is square.",
  },
  {
    icon: GappingIcon,
    name: "Club Gapping",
    body: "Log carry distances and see your average per club.",
  },
];

const MEMBER_BENEFITS: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accent: "brand" | "gold";
}[] = [
  {
    icon: CalendarCheckIcon,
    title: "A Fresh Golfable, Every Day",
    body: "One drill, same for every golfer training that day — no more guessing what to practice.",
    accent: "brand",
  },
  {
    icon: TargetIcon,
    title: "Scored to Your Tier",
    body: "Targets built for Scratch+, Low, Mid, or High, so the challenge always fits your game.",
    accent: "brand",
  },
  {
    icon: TrophyIcon,
    title: "Daily Leaderboard",
    body: "A fresh board every day, split by tier — legit bragging rights, reset every morning.",
    accent: "gold",
  },
  {
    icon: ClockRewindIcon,
    title: "Catch Up Anytime",
    body: "Miss a day? Every past Golfable lives in your Library and still counts toward your goal.",
    accent: "brand",
  },
  {
    icon: TrendUpIcon,
    title: "Real Progress, Tracked",
    body: "Watch your trend on drills you repeat and see your weekly goal fill in, week after week.",
    accent: "brand",
  },
  {
    icon: ChooseIcon,
    title: "Build Your Own Program",
    body: "Prefer to pick and choose? Play any drill in the library whenever you want — it still counts toward your weekly goal.",
    accent: "brand",
  },
  {
    icon: BadgeCheckIcon,
    title: "Founding Member Status",
    body: "Join now and lock in free access forever as one of our first 100 members.",
    accent: "gold",
  },
];

export function MarketingHome() {
  const [email, setEmail] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    getFounderSpotsRemaining().then(setSpotsRemaining);
  }, []);

  const showCountdown = spotsRemaining !== null && spotsRemaining / FOUNDER_SPOTS <= COUNTDOWN_THRESHOLD;
  const spotsFull = spotsRemaining === 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="bg-brand-dark px-6 py-2 text-center">
        <p className="font-label text-gold text-sm font-semibold tracking-wide whitespace-nowrap">
          {spotsFull
            ? "FOUNDER SPOTS ARE FULL."
            : showCountdown
              ? `ONLY ${spotsRemaining} FOUNDER SPOT${spotsRemaining === 1 ? "" : "S"} LEFT — FREE FOREVER.`
              : "100 FOUNDER SPOTS — FREE FOREVER."}{" "}
          <Link to="/signup" className="underline underline-offset-2">
            {spotsFull ? "Join the waitlist" : "Claim yours"}
          </Link>
        </p>
      </div>

      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <GolfableMark className="h-9 w-9" />
          <span className="font-display text-brand text-3xl tracking-wide">GOLFABLE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="font-label rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="font-label rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Join Free
          </Link>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[92vh] items-center overflow-hidden px-6 py-24 text-center">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/hero-course.png)",
              backgroundSize: "cover",
              backgroundPosition: "center 60%",
              animation: "ken-burns 22s ease-in-out infinite alternate",
            }}
          />
          <div className="from-brand-dark/80 absolute inset-0 bg-gradient-to-t via-black/30 to-black/10" />
          <div className="relative w-full">
            <div className="flex justify-center">
              <span className="font-label inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-sm">
                100 Founder Spots — Free Forever
              </span>
            </div>
            <h1 className="font-display mt-5 text-5xl tracking-wide text-white sm:text-7xl">
              Practice. <span className="text-gold">Gamified.</span>
            </h1>
            <p className="font-body mx-auto mt-4 max-w-xl text-lg text-white/85">
              Intelligently and intuitively programmed practice — scored, tracked, competitive, and
              gamified — built to make real progress in your golf game.
            </p>
            <Link
              to="/signup"
              className="font-label bg-gold text-brand-dark mt-8 inline-block rounded-md px-7 py-3.5 text-sm font-semibold shadow-lg"
            >
              Join free — no card required
            </Link>
          </div>
          <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce sm:block">
            <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6 text-white/70" aria-hidden="true">
              <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        <section className="bg-brand-dark px-6 py-5">
          <p className="font-body mx-auto max-w-2xl text-center text-sm text-white/90">
            <span className="font-label font-semibold text-white">No swing changes. No swing tips.</span>{" "}
            Golfable doesn't touch your mechanics — it changes how you practice and train, so the
            improvement is real and it lasts.
          </p>
        </section>

        <section className="bg-neutral-50 px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Sound Familiar?</Eyebrow>
            <h3 className="font-display mt-3 text-center text-4xl tracking-wide sm:text-5xl">
              You've hit that putting drill a hundred times.
              <br className="hidden sm:block" /> Do you know if it's working?
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              Golfable didn't invent new drills. It's a curated program of the ones you probably already
              know — the putting gate, the fairway finder, the up-and-down ladder — done in a way that's
              scored, tracked, and just competitive enough that you can actually see whether you're
              getting better.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {FRICTIONLESS.map((item) => (
                <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
                  <div className="bg-brand/10 text-brand mx-auto flex h-11 w-11 items-center justify-center rounded-full">
                    <CheckIcon className="h-5 w-5" />
                  </div>
                  <h4 className="font-label mt-3 text-base font-semibold">{item.title}</h4>
                  <p className="font-body mt-1.5 text-sm text-neutral-600">{item.body}</p>
                </div>
              ))}
            </div>

            <p className="font-body mx-auto mt-8 max-w-lg text-center text-neutral-600">
              You're not adding a new habit. You're doing the practice you already do — just deliberately,
              with a number attached, so the reps you're already putting in finally add up to something
              you can see.
            </p>

            <div className="mt-6 flex justify-center">
              <Link
                to="/signup"
                className="font-label bg-brand inline-block rounded-md px-7 py-3.5 text-sm font-semibold text-white shadow-lg"
              >
                Join free — see your first score in minutes
              </Link>
            </div>
          </Reveal>
        </section>

        <section className="bg-white px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Why Golfable</Eyebrow>
            <h3 className="font-display mt-3 text-center text-4xl tracking-wide sm:text-5xl">
              More instruction than ever.
              <br className="hidden sm:block" /> Handicaps haven't moved.
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              Golfers today have more lessons, technology, and data available than any generation before
              them — and average handicaps haven't improved in decades. That's not an information
              problem.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="font-label text-sm font-semibold tracking-widest text-neutral-400 uppercase">
                  The problem
                </p>
                <p className="font-body mt-2 text-sm text-neutral-700">
                  Hitting range balls for an hour doesn't transfer to the course. Endless reps with no
                  score, no target, and no reason to care just builds a better range game.
                </p>
              </div>
              <div className="bg-brand rounded-xl p-6 text-white shadow-lg">
                <p className="font-label text-sm font-semibold tracking-widest text-white/60 uppercase">
                  The Golfable way
                </p>
                <p className="font-body mt-2 text-sm text-white/90">
                  Short, scored sessions built around real on-course situations — not swing mechanics.
                  Every Golfable is gamified and over in minutes, so you actually do it, and it shows up
                  in your score.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="bg-neutral-50 px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>How it works</Eyebrow>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="font-display bg-brand flex h-8 w-8 items-center justify-center rounded-full text-sm text-white">
                    {item.step}
                  </div>
                  <h3 className="font-label mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="font-body mt-1.5 text-sm text-neutral-600">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="bg-white px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Two Ways to Train</Eyebrow>
            <h3 className="font-display mt-3 text-center text-4xl tracking-wide sm:text-5xl">
              Follow the program, or build your own
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              Just like CrossFit's daily WOD, some golfers show up and do exactly what's prescribed. Others
              like to pick their own workout. Golfable works either way.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="bg-brand/10 text-brand flex h-11 w-11 items-center justify-center rounded-full">
                  <CalendarCheckIcon className="h-5 w-5" />
                </div>
                <h4 className="font-label mt-3 text-base font-semibold">Today's Golfable</h4>
                <p className="font-body mt-1.5 text-sm text-neutral-600">
                  One shared drill, the same for every golfer training that day. Show up, play it, log
                  your score — no decisions required.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="bg-brand/10 text-brand flex h-11 w-11 items-center justify-center rounded-full">
                  <ChooseIcon className="h-5 w-5" />
                </div>
                <h4 className="font-label mt-3 text-base font-semibold">Choose Your Own Golfable</h4>
                <p className="font-body mt-1.5 text-sm text-neutral-600">
                  Want to build your own program? Pick any drill in the library, any time. It updates your
                  personal best and counts toward your weekly goal, exactly like the daily Golfable.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <CtaBand heading="See it for yourself — play your first Golfable today." />

        <section className="border-brand/10 bg-brand/5 border-y px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Just Added</Eyebrow>
            <h3 className="font-display mt-3 text-center text-4xl tracking-wide sm:text-5xl">
              Built to keep you improving
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              New this month: a bag that knows your yardages, a handicap that tracks itself, and a score
              built to show your real progress.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {NEW_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="bg-brand/10 text-brand flex h-11 w-11 items-center justify-center rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-label mt-3 text-base font-semibold">{feature.title}</h4>
                    <p className="font-body mt-1.5 text-sm text-neutral-600">{feature.body}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section className="bg-white px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Training Tools</Eyebrow>
            <h3 className="font-display mt-3 text-center text-4xl tracking-wide sm:text-5xl">
              Your phone, turned into a practice aid
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              A free set of tools that live right in the app — no extra gadgets required.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRAINING_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.name} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="bg-brand/10 text-brand flex h-11 w-11 items-center justify-center rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-label mt-3 text-base font-semibold">{tool.name}</h4>
                    <p className="font-body mt-1.5 text-sm text-neutral-600">{tool.body}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section className="bg-brand-dark px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow tone="dark">A Peek Inside the App</Eyebrow>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-sm text-white/70">
              Two real Golfables, shown exactly how they'd land on your Today screen the moment you open
              the app.
            </p>
            <div className="mt-10 grid justify-items-center gap-10 sm:grid-cols-2">
              {SNEAK_PEEK_DRILLS.map(({ drill, maxScore }) => (
                <div
                  key={drill.id}
                  className="w-full max-w-[300px] rounded-[2.25rem] bg-neutral-900 p-2.5 shadow-2xl"
                >
                  <div className="flex justify-center pt-1 pb-1.5">
                    <div className="h-1.5 w-16 rounded-full bg-neutral-700" />
                  </div>
                  <div className="max-h-[600px] overflow-y-auto rounded-[1.75rem] bg-neutral-50">
                    <DrillFreshView
                      drill={drill}
                      tier="mid"
                      maxScore={maxScore}
                      weeklyGoal={4}
                      sessionsThisWeek={2}
                      interactive={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <CtaBand heading="Every skill category, one home for your training." />

        <section className="relative overflow-hidden px-6 py-16">
          <div
            className="absolute inset-0 sm:hidden"
            style={{
              backgroundImage: "url(/categories-bg-mobile.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0 hidden sm:block"
            style={{
              backgroundImage: "url(/categories-bg-desktop.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-white/80" />
          <Reveal className="relative mx-auto max-w-3xl">
            <Eyebrow>Four Skill Categories</Eyebrow>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-sm text-neutral-600">
              Every Golfable falls into one of four categories, each with its own badge, color, and spot
              on the weekly calendar.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {SKILL_CATEGORIES.map((category) => {
                const info = CATEGORY_INFO[category];
                const detail = CATEGORY_DETAIL[category];
                return (
                  <div key={category} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[category]}`}
                      >
                        <CategoryIcon category={category} className="h-5 w-5" />
                      </div>
                      <span className={`font-label text-lg font-semibold ${CATEGORY_TEXT[category]}`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="font-body mt-3 text-sm text-neutral-700">{detail.description}</p>
                    <p className="font-label mt-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                      {detail.schedule}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section className="bg-brand px-6 py-20 text-white sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white/15">
                <TrophyIcon className="text-gold h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-3xl tracking-wide sm:text-4xl">Leaderboard</h2>
                <p className="font-body mt-1 text-white/80">
                  Every Golfable resets the board daily, split by handicap tier — so you're only ever
                  measured against golfers playing your game, not the club champion.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-6 flex max-w-sm items-center gap-3 rounded-lg bg-white/10 p-4 sm:mx-0">
              <div className="bg-gold/20 flex h-11 w-11 flex-none items-center justify-center rounded-full">
                <TrophyIcon className="text-gold h-6 w-6" />
              </div>
              <p className="font-body text-base text-white">
                <span className="font-display mr-2 text-2xl align-middle">7/10</span>
                You're #3 in Mid today
              </p>
            </div>
          </Reveal>
        </section>

        <section className="bg-gold/5 px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="bg-gold/15 flex h-14 w-14 flex-none items-center justify-center rounded-full">
                <ChallengeIcon className="text-gold h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-3xl tracking-wide sm:text-4xl">Challenge a Friend</h2>
                <p className="font-body mt-1 text-neutral-600">
                  Heading to the range together? Pick any drill from the library, share a 5-character
                  code, and compete with up to 4 friends on a live-updating scoreboard. Changed your mind?
                  Cancel a challenge anytime before anyone joins. Add an optional wager — just for fun, no
                  real money changes hands.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <CtaBand heading="Bring your crew. Compete for free." tone="brand-dark" />

        <section className="bg-white px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Handicap Tiers</Eyebrow>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-sm text-neutral-600">
              Targets get tougher as your handicap gets lower — the most fun way to get into the game and
              start practicing real skills, wherever you're starting from.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {HANDICAP_TIERS.map((tier) => {
                const info = TIER_INFO[tier];
                const detail = TIER_DETAIL[tier];
                return (
                  <div key={tier} className={`rounded-xl border-2 bg-white p-5 shadow-sm ${TIER_BORDER[tier]}`}>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-display text-3xl tracking-wide ${TIER_TEXT[tier]}`}>
                        {info.label}
                      </span>
                      <span className="font-label text-sm text-neutral-500">{info.sublabel}</span>
                    </div>
                    <p className="font-body mt-3 text-sm text-neutral-700">{detail.description}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section className="bg-neutral-50 px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl">
            <Eyebrow>Member Benefits</Eyebrow>
            <h3 className="font-display mt-3 text-center text-4xl tracking-wide sm:text-5xl">
              What you get, starting today
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              No gimmicks, no upsells — just the tools that make practice worth showing up for.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MEMBER_BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        benefit.accent === "gold" ? "bg-gold/15 text-gold" : "bg-brand/10 text-brand"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-label mt-3 text-base font-semibold">{benefit.title}</h4>
                    <p className="font-body mt-1.5 text-sm text-neutral-600">{benefit.body}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <CtaBand heading="Founding member spots are going fast." />

        <section className="bg-white px-6 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-2xl">
            <Eyebrow>Frequently Asked Questions</Eyebrow>
            <div className="mt-8 space-y-2">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={faq.question} className="rounded-xl border border-neutral-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="font-label text-base font-semibold">{faq.question}</span>
                      <ChevronDownIcon open={open} className="h-5 w-5 flex-none text-neutral-400" />
                    </button>
                    {open && (
                      <p className="font-body px-5 pb-4 text-sm text-neutral-600">{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section
          id="join"
          className="bg-brand-dark scroll-mt-6 px-6 py-20 text-center text-white sm:py-28"
        >
          <Reveal className="mx-auto max-w-2xl">
            <p className="font-label text-gold text-sm font-semibold tracking-widest uppercase">
              Why We Built Golfable
            </p>
            <p className="font-body mx-auto mt-3 max-w-xl text-white/90">
              Practice shouldn't feel like a chore. We built Golfable to make it fun — short, scored
              sessions with trackable progress and a community of golfers chasing the same daily
              challenge, all over the world. It's a serious way to lower your handicap, wrapped in a
              format that's playful and just competitive enough to keep you coming back. Joining Golfable
              means joining a movement. We all get better together.
            </p>

            <h2 className="font-display mt-8 text-4xl tracking-wide sm:text-5xl">
              Practice. <span className="text-gold">Gamified.</span>
            </h2>
            <p className="font-body mt-2 text-white/80">
              Join us now — free during early access.
            </p>

            <form
              className="mx-auto mt-6 flex max-w-sm gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                // TODO: wire to a Supabase table (e.g. `waitlist`) once the project is provisioned.
                console.log("waitlist signup:", email);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="font-body flex-1 rounded-md border-0 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400"
              />
              <button
                type="submit"
                className="font-label rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white"
              >
                Notify me
              </button>
            </form>
          </Reveal>
        </section>
      </main>

      <footer className="bg-brand-dark px-6 py-10 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          <GolfableMark className="h-9 w-9" tone="on-dark" />
          <p className="font-body text-sm text-white/40">{CAPTION_HASHTAGS}</p>
          <Link to="/terms" className="font-label text-sm font-semibold text-white/50 underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
