import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HANDICAP_TIERS, TIER_INFO, type HandicapTier } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { updateProfile } from "../../lib/golfableApi";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8.3l6.5 3.7-6.5 3.7v-7.4Z" fill="currentColor" />
    </svg>
  );
}

const SURPRISES = [
  "Your handicap doesn't care about your ego. Neither does the ball.",
  "Somewhere right now, someone is three-putting from four feet. You are not alone.",
  "A bad day on the course still beats a good day almost anywhere else.",
  "The shortest distance between two points is a straight line. Golf disagrees.",
  "Every scratch golfer was once a beginner who refused to stop swinging.",
  "A Golfable a day keeps the yips away!",
  "It's just 15 minutes -- what are you waiting for?",
  "Let's go play the world's best sport!",
  "A single deep breath can lead to a better round (and day).",
  "If you're good, play fast. If you're bad, play faster.",
  "Leave the greens nicer than you found them!",
  "Only hackers don't rake their bunkers.",
  "I hope you have the best round (and day) ever!",
];

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const TIKTOK_HANDLE = "golfablegames";
const TIKTOK_POSTS = [
  "https://www.tiktok.com/@golfablegames/video/7641981066168880414",
  "https://www.tiktok.com/@golfablegames/photo/7654358271163174175",
  "https://www.tiktok.com/@golfablegames/photo/7649399288216309023",
  "https://www.tiktok.com/@golfablegames/photo/7649779091914181901",
  "https://www.tiktok.com/@golfablegames/video/7642720526951107870",
  "https://www.tiktok.com/@golfablegames/video/7646804815716158733",
  "https://www.tiktok.com/@golfablegames/video/7646628639349542158",
  "https://www.tiktok.com/@golfablegames/photo/7647915560553958669",
];

export function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [tier, setTier] = useState<HandicapTier>(profile?.tier ?? "mid");
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weekly_goal ?? 4);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);

  if (!profile) return null;
  const tierInfo = TIER_INFO[profile.tier];

  function startEditing() {
    setFirstName(profile!.first_name);
    setLastName(profile!.last_name);
    setTier(profile!.tier);
    setWeeklyGoal(profile!.weekly_goal);
    setError(null);
    setEditing(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setError("First and last name are both required.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(profile!.id, { first_name: trimmedFirst, last_name: trimmedLast, tier, weekly_goal: weeklyGoal });
      await refreshProfile();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong -- try again.");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    // Navigate first: once the session clears, RequireAuth's own redirect
    // to /login can otherwise win the race and stick the user there
    // instead of the marketing page this button is supposed to land on.
    navigate("/", { replace: true });
    await signOut();
  }

  function revealSurprise() {
    const options = SURPRISES.filter((s) => s !== surprise);
    setSurprise(options[Math.floor(Math.random() * options.length)]);
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        <h1 className="font-display text-2xl tracking-wide">Edit Profile</h1>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                First name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Last name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Handicap tier
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {HANDICAP_TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
                    tier === t ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {TIER_INFO[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Weekly goal
            </label>
            <div className="mt-1 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWeeklyGoal(n)}
                  className={`font-label rounded-md border px-2 py-2 text-sm font-semibold ${
                    weeklyGoal === n ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-label flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-label bg-brand flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Profile</h1>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Name
        </p>
        <p className="font-display text-xl">
          {profile.first_name} {profile.last_name}
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Handicap tier
        </p>
        <p className="font-display text-xl">{tierInfo.label}</p>
      </div>
      <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Weekly goal
        </p>
        <p className="font-display text-xl">{profile.weekly_goal} Golfables / week</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Member Since
          </p>
          <p className="font-display text-xl">{formatMemberSince(profile.created_at)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Membership
          </p>
          <p className="font-display text-gold text-xl">Founder</p>
        </div>
      </div>

      <button
        type="button"
        onClick={startEditing}
        className="font-label bg-brand mt-6 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white"
      >
        Edit Profile
      </button>
      <button
        type="button"
        onClick={handleSignOut}
        className="font-label mt-3 w-full rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-600"
      >
        Sign out
      </button>

      <div className="mt-8 rounded-lg border-2 border-dashed border-neutral-300 bg-white p-5 text-center">
        {surprise ? (
          <>
            <p className="font-body text-neutral-700 italic">&ldquo;{surprise}&rdquo;</p>
            <button
              type="button"
              onClick={revealSurprise}
              className="font-label text-brand mt-3 text-sm font-semibold underline"
            >
              Another one
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={revealSurprise}
            className="font-label bg-gold w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
          >
            Click Me For a Surprise
          </button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          On TikTok
        </h2>
        <p className="font-body mb-3 text-sm text-neutral-600">
          New drills, real attempts, and the occasional shank.
        </p>
        <a
          href={`https://www.tiktok.com/@${TIKTOK_HANDLE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-label mb-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Follow @{TIKTOK_HANDLE}
        </a>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {TIKTOK_POSTS.map((url) => {
            const isPhoto = url.includes("/photo/");
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-none flex-col items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-neutral-900 text-white shadow-sm"
                style={{ width: 130, height: 260 }}
              >
                <PlayIcon className="h-10 w-10" />
                <span className="font-label text-xs font-semibold tracking-wide text-white/70 uppercase">
                  {isPhoto ? "Photo" : "Video"}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Join the Community
        </h2>
        <p className="font-body mb-3 text-sm text-neutral-600">
          Join the Golfable community on Facebook. Share your scores. See what other golfers are up to. Get
          special tips and insights and more.
        </p>
        <a
          href="https://www.facebook.com/groups/golfable"
          target="_blank"
          rel="noopener noreferrer"
          className="font-label inline-flex items-center gap-2 rounded-md bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white"
        >
          <FacebookIcon className="h-4 w-4" />
          Join our Facebook Group
        </a>
      </div>
    </div>
  );
}
