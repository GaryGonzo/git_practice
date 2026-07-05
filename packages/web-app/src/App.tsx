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

function App() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-4">
        <span className="font-display text-2xl tracking-wide">GOLFABLE</span>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="text-center">
          <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
            A Golfable a day
            <br />
            keeps the yips away
          </h1>
          <p className="font-body mt-4 text-lg text-neutral-600">
            Daily golf skill challenges, scored against your handicap tier.
          </p>
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

        <section className="mt-16 rounded-xl bg-white p-8 text-center border border-neutral-200">
          <h2 className="font-display text-2xl tracking-wide">Join the waitlist</h2>
          <p className="font-body mt-2 text-neutral-600">
            The paid app is in development. Drop your email to get notified at launch.
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
          <button
            type="button"
            disabled
            title="Stripe checkout will be wired up once pricing is finalized"
            className="font-label mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-400"
          >
            Subscribe (coming soon)
          </button>
        </section>
      </main>

      <footer className="border-t border-neutral-200 px-6 py-6 text-center">
        <p className="font-body text-xs text-neutral-400">{CAPTION_HASHTAGS}</p>
      </footer>
    </div>
  );
}

export default App;
