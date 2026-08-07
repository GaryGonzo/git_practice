import { Link } from "react-router-dom";

export function NotFoundScreen() {
  return (
    <div className="mx-auto max-w-sm px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Page not found</h1>
      <Link to="/" className="font-display bg-brand mt-6 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white">
        Go home
      </Link>
    </div>
  );
}
