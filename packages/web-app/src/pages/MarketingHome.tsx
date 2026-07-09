import { useEffect, useState } from "react";
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

const REVIEWS = [
  {
    quote:
      "Finally, practice that doesn't feel like homework. I actually look forward to my Golfable every morning.",
    name: "Jake R.",
    credential: "12 Handicap",
    initials: "JR",
    color: "bg-driver",
  },
  {
    quote: "I've cut four strokes off my handicap in two months. The scoring makes every rep count.",
    name: "Maria S.",
    credential: "18 Handicap",
    initials: "MS",
    color: "bg-irons",
  },
  {
    quote:
      "As a coach, I finally have something to send students between lessons that actually sticks.",
    name: "Tom Bradley",
    credential: "PGA Teaching Professional",
    initials: "TB",
    color: "bg-wedges",
  },
  {
    quote: "The daily leaderboard is dangerously addictive. My whole group chat is obsessed.",
    name: "Chris D.",
    credential: "9 Handicap",
    initials: "CD",
    color: "bg-putter",
  },
  {
    quote: "Short, scored, and actually fun — this is what golf practice should have been all along.",
    name: "Dana W.",
    credential: "Scratch Golfer",
    initials: "DW",
    color: "bg-driver",
  },
  {
    quote: "My students show up more prepared than ever. Golfable does the accountability I can't do for them.",
    name: "Coach Lisa Park",
    credential: "LPGA Teaching Professional",
    initials: "LP",
    color: "bg-irons",
  },
];

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L1.5 7.6l5.9-.7L10 1.5z" />
    </svg>
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

const FAQS = [
  {
    question: "What is Golfable?",
    answer:
      "A daily golf skill challenge. Every weekday, every golfer trains the exact same drill -- you play it, log your score, and see how you compare to others in your handicap tier.",
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

export function MarketingHome() {
  const [email, setEmail] = useState("");
  const [activeReview, setActiveReview] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((i) => (i + 1) % REVIEWS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="bg-brand-dark px-6 py-2 text-center">
        <p className="font-label text-gold text-sm font-semibold tracking-wide whitespace-nowrap">
          100 FOUNDER SPOTS — FREE FOREVER.{" "}
          <Link to="/signup" className="underline underline-offset-2">
            Claim yours
          </Link>
        </p>
      </div>

      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <GolfableMark className="h-8 w-8" />
          <span className="font-display text-2xl tracking-wide">GOLFABLE</span>
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
        <section className="relative overflow-hidden px-6 py-24 text-center sm:py-32">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/hero-course.png)",
              backgroundSize: "cover",
              backgroundPosition: "center 60%",
            }}
          />
          <div className="absolute inset-0 bg-white/55" />
          <div className="relative">
            <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
              A Golfable a day
              <br />
              keeps the <span className="text-brand">yips away</span>
            </h1>
            <p className="font-body mx-auto mt-4 max-w-xl text-lg text-neutral-700">
              Golfable is the CrossFit of golf skills — one structured drill, shared by everyone
              training that day, scored against your handicap so the challenge is actually yours.
            </p>
            <Link
              to="/signup"
              className="font-label bg-brand mt-8 inline-block rounded-md px-6 py-3 text-sm font-semibold text-white"
            >
              Join free — no card required
            </Link>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Why Golfable
            </h2>
            <h3 className="font-display mt-2 text-center text-3xl tracking-wide sm:text-4xl">
              More instruction than ever.
              <br className="hidden sm:block" /> Handicaps haven't moved.
            </h3>
            <p className="font-body mx-auto mt-3 max-w-xl text-center text-neutral-600">
              Golfers today have more lessons, technology, and data available than any generation before
              them — and average handicaps haven't improved in decades. That's not an information
              problem.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-5">
                <p className="font-label text-sm font-semibold tracking-widest text-neutral-400 uppercase">
                  The problem
                </p>
                <p className="font-body mt-2 text-sm text-neutral-700">
                  Hitting range balls for an hour doesn't transfer to the course. Endless reps with no
                  score, no target, and no reason to care just builds a better range game.
                </p>
              </div>
              <div className="bg-brand rounded-lg p-5 text-white">
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
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              How it works
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="rounded-lg border border-neutral-200 bg-white p-5">
                  <div className="font-display bg-brand flex h-8 w-8 items-center justify-center rounded-full text-sm text-white">
                    {item.step}
                  </div>
                  <h3 className="font-label mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="font-body mt-1.5 text-sm text-neutral-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              A Peek Inside the App
            </h2>
            <p className="font-body mx-auto mt-2 max-w-xl text-center text-sm text-neutral-600">
              Two real Golfables, shown exactly how they'd land on your Today screen the moment you open
              the app.
            </p>
            <div className="mt-8 grid justify-items-center gap-10 sm:grid-cols-2">
              {SNEAK_PEEK_DRILLS.map(({ drill, maxScore }) => (
                <div
                  key={drill.id}
                  className="w-full max-w-[300px] rounded-[2.25rem] bg-neutral-900 p-2.5 shadow-xl"
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
          </div>
        </section>

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
          <div className="relative mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Four Skill Categories
            </h2>
            <p className="font-body mx-auto mt-2 max-w-xl text-center text-sm text-neutral-600">
              Every Golfable falls into one of four categories, each with its own badge, color, and spot
              on the weekly calendar.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {SKILL_CATEGORIES.map((category) => {
                const info = CATEGORY_INFO[category];
                const detail = CATEGORY_DETAIL[category];
                return (
                  <div key={category} className="rounded-lg border border-neutral-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`font-display flex h-10 w-10 flex-none items-center justify-center rounded-full text-lg text-white ${CATEGORY_BG[category]}`}
                      >
                        {info.badge}
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
          </div>
        </section>

        <section className="bg-brand px-6 py-16 text-white">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white/15">
                <TrophyIcon className="text-gold h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wide">Leaderboard</h2>
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
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Handicap Tiers
            </h2>
            <p className="font-body mx-auto mt-2 max-w-xl text-center text-sm text-neutral-600">
              Targets get tougher as your handicap gets lower — the most fun way to get into the game and
              start practicing real skills, wherever you're starting from.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {HANDICAP_TIERS.map((tier) => {
                const info = TIER_INFO[tier];
                const detail = TIER_DETAIL[tier];
                return (
                  <div key={tier} className={`rounded-lg border-2 bg-white p-5 ${TIER_BORDER[tier]}`}>
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
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-16">
          <div
            className="absolute inset-0 sm:hidden"
            style={{
              backgroundImage: "url(/reviews-bg-mobile.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0 hidden sm:block"
            style={{
              backgroundImage: "url(/reviews-bg-desktop.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-white/80" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              What Users and Golf Pros Are Saying
            </h2>
            <div className="relative mt-8 min-h-[260px] sm:min-h-[220px]">
              {REVIEWS.map((review, i) => (
                <div
                  key={review.name}
                  className={`rounded-lg border border-neutral-200 bg-white p-8 text-center transition-opacity duration-500 ${
                    i === activeReview ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
                  }`}
                >
                  <div className="text-gold flex justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <StarIcon key={s} className="h-5 w-5" />
                    ))}
                  </div>
                  <p className="font-body mt-4 text-lg text-neutral-800">&ldquo;{review.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <div
                      className={`font-display flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm text-white ${review.color}`}
                    >
                      {review.initials}
                    </div>
                    <div className="text-left">
                      <p className="font-label text-sm font-semibold">{review.name}</p>
                      <p className="font-body text-sm text-neutral-500">{review.credential}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveReview(i)}
                  aria-label={`Show review ${i + 1}`}
                  className={`h-2 w-2 rounded-full ${i === activeReview ? "bg-brand" : "bg-neutral-300"}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-2">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={faq.question} className="rounded-lg border border-neutral-200 bg-white">
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
          </div>
        </section>

        <section id="join" className="bg-brand scroll-mt-6 px-6 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl">
            <p className="font-label text-sm font-semibold tracking-widest text-white/60 uppercase">
              Why We Built Golfable
            </p>
            <p className="font-body mx-auto mt-3 max-w-xl text-white/90">
              Practice shouldn't feel like a chore. We built Golfable to make it fun — short, scored
              sessions with trackable progress and a community of golfers chasing the same daily
              challenge, all over the world. It's a serious way to lower your handicap, wrapped in a
              format that's playful and just competitive enough to keep you coming back. Joining Golfable
              means joining a movement. We all get better together.
            </p>

            <h2 className="font-display mt-8 text-3xl tracking-wide sm:text-4xl">
              A Golfable a Day Keeps the Yips Away
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
          </div>
        </section>
      </main>

      <footer className="bg-brand-dark px-6 py-10 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          <GolfableMark className="h-9 w-9" tone="on-dark" />
          <p className="font-body text-sm text-white/40">{CAPTION_HASHTAGS}</p>
        </div>
      </footer>
    </div>
  );
}
