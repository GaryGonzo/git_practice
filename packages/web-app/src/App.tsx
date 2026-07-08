import { useState } from "react";
import {
  SKILL_CATEGORIES,
  CATEGORY_INFO,
  HANDICAP_TIERS,
  TIER_INFO,
  CAPTION_HASHTAGS,
} from "@golfable/shared";

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

function App() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <span className="font-display text-2xl tracking-wide">GOLFABLE</span>
        <a
          href="#join"
          className="font-label rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Join Free
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="text-center">
          <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
            A Golfable a day
            <br />
            keeps the yips away
          </h1>
          <p className="font-body mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            Golfable is the CrossFit of golf skills — one structured drill, shared by everyone training
            that day, scored against your handicap so the challenge is actually yours.
          </p>
          <a
            href="#join"
            className="font-label mt-8 inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
          >
            Join free — no card required
          </a>
        </section>

        <section className="mt-20">
          <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
            How it works
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-lg border border-neutral-200 bg-white p-5">
                <div className="font-display flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm text-white">
                  {item.step}
                </div>
                <h3 className="font-label mt-3 text-base font-semibold">{item.title}</h3>
                <p className="font-body mt-1.5 text-sm text-neutral-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
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
        </section>

        <section className="mt-16 rounded-xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-neutral-900">
              <TrophyIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wide">Today's leaderboard</h2>
              <p className="font-body mt-1 text-neutral-600">
                Every Golfable resets the board daily, split by handicap tier — so you're only ever
                measured against golfers playing your game, not the club champion.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-label text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Handicap Tiers
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HANDICAP_TIERS.map((tier) => {
              const info = TIER_INFO[tier];
              return (
                <div key={tier} className="rounded-lg bg-white p-3 text-center border border-neutral-200">
                  <div className="font-label font-semibold">{info.label}</div>
                  <div className="font-label text-xs text-neutral-500">{info.sublabel}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="join" className="mt-16 scroll-mt-6 rounded-xl bg-white p-8 text-center border border-neutral-200">
          <h2 className="font-display text-2xl tracking-wide">Join Golfable — free during early access</h2>
          <p className="font-body mt-2 text-neutral-600">
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
              className="font-body flex-1 rounded-md border border-neutral-300 px-3 py-2"
            />
            <button
              type="submit"
              className="font-label rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white"
            >
              Notify me
            </button>
          </form>
        </section>
      </main>

      <footer className="border-t border-neutral-200 px-6 py-6 text-center">
        <p className="font-body text-xs text-neutral-400">{CAPTION_HASHTAGS}</p>
      </footer>
    </div>
  );
}

export default App;
