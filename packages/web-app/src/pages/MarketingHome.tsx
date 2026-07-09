import { useState } from "react";
import { Link } from "react-router-dom";
import {
  SKILL_CATEGORIES,
  CATEGORY_INFO,
  HANDICAP_TIERS,
  TIER_INFO,
  CAPTION_HASHTAGS,
} from "@golfable/shared";
import { GolfableMark } from "../components/GolfableMark";

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

const SNEAK_PEEK_DRILLS = [
  {
    id: "fairway-finder",
    category: "driver" as const,
    name: "Fairway Finder",
    setup:
      "Pick a hole with a fairway you can see the width of. Hit 10 drives, aiming to find the short grass every time.",
    tier: "mid" as const,
    target: "4/10",
  },
  {
    id: "the-gate",
    category: "putter" as const,
    name: "The Gate",
    setup:
      "Push two tees into the green just wider than your putter head, forming a gate. Putt 10 balls from 6 feet.",
    tier: "mid" as const,
    target: "5/10",
  },
];

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

export function MarketingHome() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="bg-brand-dark px-6 py-2 text-center">
        <p className="font-label text-gold text-xs font-semibold tracking-wide whitespace-nowrap sm:text-sm">
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
                <p className="font-label text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                  The problem
                </p>
                <p className="font-body mt-2 text-sm text-neutral-700">
                  Hitting range balls for an hour doesn't transfer to the course. Endless reps with no
                  score, no target, and no reason to care just builds a better range game.
                </p>
              </div>
              <div className="bg-brand rounded-lg p-5 text-white">
                <p className="font-label text-xs font-semibold tracking-widest text-white/60 uppercase">
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
              Two real Golfables, shown exactly how they'd land on your Today screen.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {SNEAK_PEEK_DRILLS.map((drill) => {
                const drillTierInfo = TIER_INFO[drill.tier];
                return (
                  <div
                    key={drill.id}
                    className="rounded-2xl border-2 border-neutral-900/10 bg-white p-5 shadow-sm"
                  >
                    <p className="font-label text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                      Today's Golfable
                    </p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <div
                        className={`font-display flex h-9 w-9 items-center justify-center rounded-full text-base text-white ${CATEGORY_BG[drill.category]}`}
                      >
                        {CATEGORY_INFO[drill.category].badge}
                      </div>
                      <div>
                        <p
                          className={`font-label text-xs font-semibold tracking-wide uppercase ${CATEGORY_TEXT[drill.category]}`}
                        >
                          {CATEGORY_INFO[drill.category].label}
                        </p>
                        <h3 className="font-display text-xl tracking-wide">{drill.name}</h3>
                      </div>
                    </div>
                    <p className="font-body mt-3 text-sm text-neutral-600">{drill.setup}</p>
                    <div className={`mt-4 rounded-lg border-2 bg-neutral-50 p-3 ${TIER_BORDER[drill.tier]}`}>
                      <p className="font-label text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                        Your Target &middot; {drillTierInfo.label}
                      </p>
                      <p className={`font-display text-2xl ${TIER_TEXT[drill.tier]}`}>{drill.target}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Four Skill Categories
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {SKILL_CATEGORIES.map((category) => {
                const info = CATEGORY_INFO[category];
                return (
                  <div
                    key={category}
                    className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4"
                  >
                    <div
                      className={`font-display flex h-10 w-10 items-center justify-center rounded-full text-lg text-white ${CATEGORY_BG[category]}`}
                    >
                      {info.badge}
                    </div>
                    <span className={`font-label text-sm font-semibold ${CATEGORY_TEXT[category]}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-brand px-6 py-16 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
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
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Handicap Tiers
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HANDICAP_TIERS.map((tier) => {
                const info = TIER_INFO[tier];
                return (
                  <div
                    key={tier}
                    className={`rounded-lg bg-white p-5 text-center border-2 ${TIER_BORDER[tier]}`}
                  >
                    <div className={`font-display text-3xl tracking-wide ${TIER_TEXT[tier]}`}>
                      {info.label}
                    </div>
                    <div className="font-label mt-1 text-sm text-neutral-500">{info.sublabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="join" className="bg-brand scroll-mt-6 px-6 py-16 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl tracking-wide">
              Join Golfable — free during early access
            </h2>
            <p className="font-body mt-2 text-white/80">
              Membership is free while we build. Drop your email and we'll let you know the moment
              accounts open.
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
          <GolfableMark className="h-9 w-9" />
          <p className="font-body text-xs text-white/40">{CAPTION_HASHTAGS}</p>
        </div>
      </footer>
    </div>
  );
}
