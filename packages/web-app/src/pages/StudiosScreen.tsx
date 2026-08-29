import { Link } from "react-router-dom";
import { CAPTION_HASHTAGS } from "@golfable/shared";
import { GolfableMark } from "../components/GolfableMark";

const CONTACT_HREF = "mailto:golfable541@gmail.com?subject=Golfable%20for%20my%20studio";

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
      <path d="M15.5 20a4.5 4.5 0 0 1 6-4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

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

function EngagementIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.5 8h13a3 3 0 0 1 2.9 3.7l-1 4A3 3 0 0 1 17.5 18c-1 0-1.9-.5-2.5-1.4L14 15h-4l-1 1.6A3 3 0 0 1 6.5 18a3 3 0 0 1-2.9-2.3l-1-4A3 3 0 0 1 5.5 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6 9.75v3.5M4.25 11.5h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="10" r="0.9" fill="currentColor" />
      <circle cx="14" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="9" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 13h16M12 9v11" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 9S9 9 9 6.5A2.5 2.5 0 0 1 12 9Zm0 0s3 0 3-2.5A2.5 2.5 0 0 0 12 9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
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

function BadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 13.5L7.5 20l4.5-2.2 4.5 2.2-1.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 9l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const BENEFITS = [
  {
    icon: GroupIcon,
    title: "One Account, Every Member",
    body: "You're the only one who signs up. Every member joins free through your own link -- no cards, no per-seat billing, no logins for you to manage.",
  },
  {
    icon: TrophyIcon,
    title: "A Private Leaderboard",
    body: "Your studio gets its own leaderboard, split by handicap tier and visible only to your members -- not the national one. Friendly competition that's just theirs.",
  },
  {
    icon: EngagementIcon,
    title: "A Genuinely Fun Engagement Tool",
    body: "A fresh, scored drill every weekday gives members a reason to open the app and think about your studio between sessions, not just during them.",
  },
  {
    icon: GiftIcon,
    title: "A Real Benefit for Members",
    body: "Free access to daily training, a private leaderboard, Challenge Mode, and every tool in the app -- a tangible perk you can offer without adding to your own overhead.",
  },
  {
    icon: TrendUpIcon,
    title: "Trackable Improvement",
    body: "See every member's tier, weekly progress, and activity from one roster -- who's engaged, who's improving, and who might need a nudge.",
  },
  {
    icon: BadgeIcon,
    title: "Keeps Your Studio Top of Mind",
    body: "Your studio's name is on their leaderboard and on the link that got them there -- so you stay part of their game, on the range or off.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "We set up your studio",
    body: "Reach out and we'll create your private studio and a join link with your name on it -- ready in minutes.",
  },
  {
    step: "2",
    title: "Share your link",
    body: "Text it, post it, hand it out in person. Anyone who joins through it gets Golfable free, tied to your studio.",
  },
  {
    step: "3",
    title: "Watch it grow",
    body: "Check in on your roster anytime -- who's playing, who's improving, and who's overdue for a nudge.",
  },
];

export function StudiosScreen() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <GolfableMark className="h-9 w-9" />
          <span className="font-display text-brand text-3xl tracking-wide">GOLFABLE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="font-label hidden text-sm font-semibold text-neutral-600 sm:inline-block">
            For Players
          </Link>
          <Link
            to="/login"
            className="font-label rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600"
          >
            Log In
          </Link>
          <a
            href={CONTACT_HREF}
            className="font-label rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Get in Touch
          </a>
        </div>
      </header>

      <main>
        <section className="bg-brand-dark px-6 py-20 text-center sm:py-28">
          <div className="mx-auto max-w-2xl">
            <span className="font-label inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest text-white uppercase">
              For Studios
            </span>
            <h1 className="font-display mt-5 text-4xl tracking-wide text-white sm:text-6xl">
              Bring Golfable to your studio
            </h1>
            <p className="font-body mx-auto mt-4 max-w-xl text-lg text-white/85">
              One free account for you. Free daily training and a private leaderboard for every member. A reason
              for your studio to stay in their pocket, long after the lesson ends.
            </p>
            <a
              href={CONTACT_HREF}
              className="font-label bg-gold text-brand-dark mt-8 inline-block rounded-md px-7 py-3.5 text-sm font-semibold shadow-lg"
            >
              Get set up -- it's free
            </a>
          </div>
        </section>

        <section className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-center text-3xl tracking-wide sm:text-4xl">
              Built for studios, free for everyone in them
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="bg-brand/10 text-brand flex h-11 w-11 items-center justify-center rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-label mt-3 text-base font-semibold">{benefit.title}</h3>
                    <p className="font-body mt-1.5 text-sm text-neutral-600">{benefit.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-neutral-50 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-label text-center text-sm font-semibold tracking-widest text-neutral-500 uppercase">
              How It Works
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
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

        <section className="bg-brand px-6 py-16 text-center text-white sm:py-20">
          <div className="mx-auto max-w-xl">
            <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
              Free for you. Free for every member.
            </h2>
            <p className="font-body mt-3 text-white/85">
              No cost to set up, no cost per member, and no catch. Tell us about your studio and we'll get you a
              join link the same day.
            </p>
            <a
              href={CONTACT_HREF}
              className="font-label bg-gold text-brand-dark mt-6 inline-block rounded-md px-7 py-3.5 text-sm font-semibold shadow-lg"
            >
              Email us to get set up
            </a>
          </div>
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
