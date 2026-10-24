import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";
import { FIT_ACCESS_CONTACT_EMAIL, FIT_ACCESS_MAILTO } from "../config/contact";

// Golfable Fit is visible to one person for now -- gated the same way
// RequireAdmin gates the admin dashboard, off a profiles.fit_access flag.
// Everyone else sees a locked "coming soon" screen at every /app/fit/* URL
// instead of the Fit screens. (Data itself is protected server-side by RLS.)
export function RequireFitAccess({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  if (!profile) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (!profile.fit_access) {
    return <FitLockedScreen />;
  }
  return <>{children}</>;
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FitLockedScreen() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <div className="bg-brand/10 text-brand flex h-16 w-16 items-center justify-center rounded-2xl">
        <LockIcon className="h-8 w-8" />
      </div>
      <span className="font-label mt-5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
        Coming soon · invite only
      </span>
      <h1 className="font-display text-brand mt-4 text-4xl tracking-wide">Golfable Fit isn't open yet</h1>
      <p className="font-body mt-3 text-neutral-600">
        It's invite-only while we finish it. Email Gary to ask for access.
      </p>
      <a
        href={FIT_ACCESS_MAILTO}
        className="font-label bg-brand mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md px-6 text-base font-semibold text-white"
      >
        Email Gary for access
      </a>
      <p className="font-body mt-2 text-xs text-neutral-500">{FIT_ACCESS_CONTACT_EMAIL}</p>
      <Link
        to="/app"
        className="font-label text-brand mt-4 inline-flex min-h-11 items-center px-4 text-sm font-semibold underline"
      >
        Back to Golfable
      </Link>
    </div>
  );
}
