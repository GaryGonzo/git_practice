import { useNavigate } from "react-router-dom";
import { TIER_INFO } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";

export function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;
  const tierInfo = TIER_INFO[profile.tier];

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Profile</h1>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Username
        </p>
        <p className="font-display text-xl">{profile.username}</p>
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

      <button
        type="button"
        onClick={handleSignOut}
        className="font-label mt-6 w-full rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-600"
      >
        Sign out
      </button>

      <div className="mt-6 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="font-label text-sm font-semibold text-neutral-400">
          Editing and subscription status land here later
        </p>
      </div>
    </div>
  );
}
