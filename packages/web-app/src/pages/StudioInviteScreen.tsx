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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Shown only to a cold, never-seen-Golfable member -- one sentence up top
// isn't much to sign up on, so this fills in just enough of "what is this"
// before asking for an account, without turning the screen into a second
// homepage.
function studioHighlights(studioName: string) {
  return [
    { title: "A fresh drill every weekday", body: "Short, scored practice sessions -- not swing tips." },
    { title: "Your studio's own leaderboard", body: `Private to ${studioName}, split by handicap tier.` },
    { title: "Free, no card required", body: `Included as part of ${studioName} -- nothing to pay, ever.` },
  ];
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

  async function handleJoin() {
    if (!session) return;
    setJoining(true);
    setError(null);
    try {
      await joinStudio(session.access_token, studio!.id);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join that studio -- try again.");
      setJoining(false);
    }
  }

  // Already a member of this exact studio -- nothing to decide, just confirm
  // and send them in.
  if (alreadyJoined) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <div className="bg-brand/10 text-brand mx-auto flex h-14 w-14 items-center justify-center rounded-full">
          <StudioIcon className="h-7 w-7" />
        </div>
        <p className="font-label mt-4 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Your Studio
        </p>
        <h1 className="font-display mt-1 text-3xl tracking-wide">You're in {studio.name}</h1>
        <p className="font-body mt-2 text-sm text-neutral-600">
          Your private studio leaderboard is ready on your Home screen.
        </p>
        <Link
          to="/app"
          className="font-label bg-brand mt-6 inline-block w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
        >
          Go to Golfable
        </Link>
      </div>
    );
  }

  // Everyone else -- a fresh visitor, an existing individual member, or a
  // member of a different studio -- sees the same invite page. Joining is
  // always an explicit click here, never automatic just from landing on the
  // link, so an already-logged-in member never gets silently switched into
  // a studio they didn't mean to join.
  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <div className="bg-brand/10 text-brand mx-auto flex h-14 w-14 items-center justify-center rounded-full">
        <StudioIcon className="h-7 w-7" />
      </div>
      <p className="font-label mt-4 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
        You've Been Invited
      </p>
      <h1 className="font-display mt-1 text-3xl tracking-wide">Join {studio.name} on Golfable</h1>
      <p className="font-body mt-2 text-sm text-neutral-600">
        Play the daily Golfable, track your progress, and see a private leaderboard just for {studio.name}.
      </p>

      {error && <p className="font-body mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3 text-left">
        {studioHighlights(studio.name).map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <div className="bg-brand/10 text-brand mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full">
              <CheckIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-label text-sm font-semibold">{item.title}</p>
              <p className="font-body text-sm text-neutral-600">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      {session ? (
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="font-label bg-brand mt-6 block w-full rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {joining ? "Joining…" : `Already a member? Join ${studio.name}`}
        </button>
      ) : (
        <>
          <Link
            to={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="font-label bg-brand mt-6 block w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
          >
            JOIN NOW
          </Link>
          <p className="font-body mt-3 text-sm text-neutral-500">
            Already have an account?{" "}
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="text-brand underline">
              Log in
            </Link>
          </p>
        </>
      )}
      <Link
        to="/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-label text-brand mt-4 inline-block text-sm font-semibold underline"
      >
        See what Golfable is about →
      </Link>
    </div>
  );
}
