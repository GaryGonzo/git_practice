import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";
import { getStudioBySlug, joinStudio, type Studio } from "../lib/golfableApi";

function StudioIcon({ className }: { className?: string }) {
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
    </svg>
  );
}

export function StudioInviteScreen() {
  const { slug } = useParams();
  const { session, profile, refreshProfile } = useAuth();

  const [studio, setStudio] = useState<Studio | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getStudioBySlug(slug).then(setStudio);
  }, [slug]);

  // A member belongs to at most one studio -- landing here while already
  // logged in is the explicit "I want to join this studio" action, so it
  // sets studio_id right away rather than waiting for a separate confirm step.
  useEffect(() => {
    if (!studio || studio.canceledAt || !profile || !session || profile.studio_id === studio.id) return;
    setJoining(true);
    setError(null);
    joinStudio(session.access_token, studio.id)
      .then(refreshProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't join that studio -- try again."))
      .finally(() => setJoining(false));
  }, [studio, profile, session, refreshProfile]);

  if (studio === undefined) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  if (studio === null || studio.canceledAt) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-wide">Studio Not Found</h1>
        <p className="font-body mt-3 text-sm text-neutral-600">
          {studio?.canceledAt
            ? "This studio is no longer active."
            : "This studio link isn't valid, or the studio has been removed."}
        </p>
        <Link to="/" className="font-label text-brand mt-6 inline-block text-sm font-semibold underline">
          Go to Golfable
        </Link>
      </div>
    );
  }

  const nextPath = `/my-studio/${studio.slug}`;
  const alreadyJoined = profile?.studio_id === studio.id;

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <div className="bg-brand/10 text-brand mx-auto flex h-14 w-14 items-center justify-center rounded-full">
        <StudioIcon className="h-7 w-7" />
      </div>
      <p className="font-label mt-4 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
        {session ? "Your Studio" : "You've Been Invited"}
      </p>
      <h1 className="font-display mt-1 text-3xl tracking-wide">
        {session ? (alreadyJoined ? `You're in ${studio.name}` : `Joining ${studio.name}…`) : `Join ${studio.name} on Golfable`}
      </h1>
      <p className="font-body mt-2 text-sm text-neutral-600">
        {session
          ? "Your private studio leaderboard is ready on your Home screen."
          : "Play the daily Golfable, track your progress, and see a private leaderboard just for your studio."}
      </p>

      {session ? (
        <Link
          to="/app"
          className="font-label bg-brand mt-6 inline-block w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
        >
          {joining ? "Joining…" : "Go to Golfable"}
        </Link>
      ) : null}
      {error && <p className="font-body mt-3 text-sm text-red-600">{error}</p>}
      {!session && (
        <>
          <Link
            to={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="font-label bg-brand mt-6 block w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
          >
            Sign Up to Join
          </Link>
          <p className="font-body mt-3 text-sm text-neutral-500">
            Already have an account?{" "}
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="text-brand underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
