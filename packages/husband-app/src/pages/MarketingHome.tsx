import { Link } from "react-router-dom";

const FEATURES = [
  {
    emoji: "☕",
    title: "Requests",
    body: "Coffee, breakfast in bed, lit candles, a drawn bath — pick from the menu or ask for something else entirely, with a note for exactly how you want it.",
  },
  {
    emoji: "✅",
    title: "Honey-do tasks",
    body: "Take out the garbage. Pick up dog food. Change that lightbulb. Assign it, attach points, and watch it get done.",
  },
  {
    emoji: "📝",
    title: "Standing notes",
    body: "Her usual Starbucks order, exactly how she takes her coffee at home — saved once, so a surprise never requires a text asking what she wants.",
  },
  {
    emoji: "🏆",
    title: "Points",
    body: "Every completed task adds to a running score. Award bonus points anytime, for anything — it's a scoreboard for being a good partner.",
  },
  {
    emoji: "🎁",
    title: "Rewards",
    body: "Set up standing rewards together, or redeem points on a special one-off request dreamed up in the moment — nothing has to be planned in advance.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Create your accounts",
    body: "One account for the wife, one for the husband. Takes about a minute each.",
  },
  {
    number: "2",
    title: "Link up as a household",
    body: "The first person to sign up gets an invite code. Share it, and you're connected.",
  },
  {
    number: "3",
    title: "Start sending things back and forth",
    body: "Requests, tasks, notes, points — all shared instantly between the two of you.",
  },
];

const SCENARIOS = [
  {
    emoji: "🌅",
    title: "Tuesday morning",
    image: "/scenario-coffee.jpg",
    body: "She taps \"Coffee\" and adds a note — oat milk latte, extra hot. He gets the alert, already knows exactly what to make, and it's in her hands before she's even out of bed.",
  },
  {
    emoji: "🎉",
    title: "No occasion at all",
    image: "/scenario-flowers.jpg",
    body: "He wants to surprise her with her Starbucks order but has never actually asked what it is. He opens Notes, finds it saved from months ago, and orders it on the way home.",
  },
  {
    emoji: "🧺",
    title: "Sunday chores",
    image: "/scenario-laundry.jpg",
    body: "She adds \"Fold the laundry\" and \"Take the dog for a walk\" to the list with points attached. He clears both, taps done, and the scoreboard updates.",
  },
];

const FAQS = [
  {
    q: "Is this only for married couples?",
    a: "No — \"husband\" and \"wife\" are just the two account types. Use it however fits your household.",
  },
  {
    q: "Do we both need to download or sign up separately?",
    a: "Yes, each partner creates their own account (one wife account, one husband account), then one of you shares an invite code so you land in the same household.",
  },
  {
    q: "Can more than two people join a household?",
    a: "A household holds one wife account and one husband account. It's built around a couple, not a group.",
  },
  {
    q: "What happens to the points?",
    a: "They're the husband's to redeem. The two of you set up standing rewards together — anything from \"make a sandwich\" or \"golf with the boys\" to something a lot more playful — each with a point cost attached. Rewards don't have to be planned ahead of time, either -- either of you can add a brand new one on the spot as a special one-off request. Once he's earned enough, he cashes one in, and it's logged for you both to see.",
  },
  {
    q: "What if I want something that's not on the request menu?",
    a: "Every request has a free-text option, so you're never limited to the built-in list of coffee, breakfast in bed, candles, and a bath.",
  },
  {
    q: "Is this an app? Do I need to download it?",
    a: "There's nothing to download from an app store -- The Husband App runs right in your phone's browser. To get an app-like icon on your home screen: on iPhone, open this site in Safari, tap the Share icon, then \"Add to Home Screen.\" On Android, open it in Chrome, tap the ⋮ menu, then \"Add to Home screen\" (or \"Install app\"). Either way you'll get a real icon that launches full-screen, just like a downloaded app.",
  },
];

export function MarketingHome() {
  return (
    <div className="text-neutral-900">
      <header
        className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-semibold">
            💛 The Husband App
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="font-body text-sm text-neutral-600 hover:text-neutral-900">
              How it works
            </a>
            <a href="#features" className="font-body text-sm text-neutral-600 hover:text-neutral-900">
              Features
            </a>
            <a href="#faq" className="font-body text-sm text-neutral-600 hover:text-neutral-900">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-display hidden text-sm font-semibold text-neutral-700 sm:inline">
              Log in
            </Link>
            <Link to="/signup" className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-brand-light">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <p className="font-display text-sm font-semibold tracking-widest text-brand uppercase">For couples</p>
            <h1 className="font-display mt-2 text-5xl">The Husband App</h1>
            <p className="font-body mt-4 text-lg text-neutral-600">
              Send a request — coffee, breakfast in bed, a lit candle. Assign a task, and earn points toward rewards
              you both set up. Keep your partner's standing order on hand so a surprise never starts with a question.
              Playful, helpful, married.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="font-display bg-brand rounded-full px-6 py-3 text-sm font-semibold text-white">
                Get started
              </Link>
              <Link
                to="/login"
                className="font-display rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700"
              >
                Log in
              </Link>
            </div>
            <img
              src="/hero.jpg"
              alt=""
              loading="lazy"
              className="mt-12 h-56 w-full rounded-2xl object-cover sm:h-72"
            />
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-center text-3xl">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="font-display bg-brand mx-auto flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold text-white">
                  {step.number}
                </div>
                <p className="font-display mt-4 text-lg font-semibold">{step.title}</p>
                <p className="font-body mt-1 text-sm text-neutral-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="bg-neutral-50">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-display text-center text-3xl">What you get</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="text-3xl">{feature.emoji}</p>
                  <p className="font-display mt-3 text-base font-semibold">{feature.title}</p>
                  <p className="font-body mt-1 text-sm text-neutral-500">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-center text-3xl">A few ways it plays out</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SCENARIOS.map((scenario) => (
              <div key={scenario.title} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <img
                  src={scenario.image}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-3xl">{scenario.emoji}</p>
                  <p className="font-display mt-3 text-base font-semibold">{scenario.title}</p>
                  <p className="font-body mt-1 text-sm text-neutral-600">{scenario.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="bg-neutral-50">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <h2 className="font-display text-center text-3xl">Questions</h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-neutral-200 bg-white p-4">
                  <summary className="font-display cursor-pointer list-none text-base font-semibold marker:content-none">
                    {faq.q}
                  </summary>
                  <p className="font-body mt-2 text-sm text-neutral-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="bg-brand rounded-3xl px-8 py-12 text-white">
            <h2 className="font-display text-3xl">Ready to get started?</h2>
            <p className="font-body mt-2 text-white/90">One account each, then you're linked up as a household.</p>
            <Link
              to="/signup"
              className="font-display mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-center sm:flex-row sm:text-left">
          <p className="font-display text-sm font-semibold">💛 The Husband App</p>
          <p className="font-body text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} The Husband App. Playful, helpful, married.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="font-body text-xs text-neutral-500 hover:text-neutral-800">
              Log in
            </Link>
            <Link to="/signup" className="font-body text-xs text-neutral-500 hover:text-neutral-800">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
