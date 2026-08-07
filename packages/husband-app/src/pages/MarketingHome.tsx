import { Link } from "react-router-dom";

export function MarketingHome() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <p className="font-display text-sm font-semibold tracking-widest text-brand uppercase">For couples</p>
      <h1 className="font-display mt-2 text-4xl">The Husband App</h1>
      <p className="font-body mt-4 text-neutral-600">
        Order coffee, breakfast in bed, or a lit candle. Assign a honey-do task and rack up points. Keep her Starbucks
        order on hand so you can surprise her without asking. Playful, helpful, married.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link to="/signup" className="font-display bg-brand rounded-full px-6 py-3 text-sm font-semibold text-white">
          Get started
        </Link>
        <Link to="/login" className="font-display rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700">
          Log in
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl">☕</p>
          <p className="font-display mt-1 text-sm font-semibold">Requests</p>
          <p className="font-body text-xs text-neutral-500">Coffee, candles, a bath, breakfast in bed.</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl">✅</p>
          <p className="font-display mt-1 text-sm font-semibold">Honey-do tasks</p>
          <p className="font-body text-xs text-neutral-500">Assign chores, earn points for getting them done.</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl">📝</p>
          <p className="font-display mt-1 text-sm font-semibold">Notes</p>
          <p className="font-body text-xs text-neutral-500">Her standard Starbucks order, always on hand.</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl">🏆</p>
          <p className="font-display mt-1 text-sm font-semibold">Points</p>
          <p className="font-body text-xs text-neutral-500">A running score for being an awesome partner.</p>
        </div>
      </div>
    </div>
  );
}
