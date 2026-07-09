import { Link } from "react-router-dom";

export function NotFoundScreen() {
  return (
    <div className="mx-auto max-w-sm px-6 py-24 text-center">
      <p className="font-label text-sm font-semibold tracking-widest text-neutral-400 uppercase">404</p>
      <h1 className="font-display mt-2 text-3xl tracking-wide">Page not found</h1>
      <p className="font-body mt-3 text-sm text-neutral-600">
        That page doesn't exist -- or it moved. Let's get you back on track.
      </p>
      <Link
        to="/"
        className="font-label bg-brand mt-6 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to Golfable
      </Link>
    </div>
  );
}
