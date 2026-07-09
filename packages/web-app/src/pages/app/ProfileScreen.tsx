import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HANDICAP_TIERS, TIER_INFO, type HandicapTier } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { isUsernameTaken, updateProfile } from "../../lib/golfableApi";

export function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [tier, setTier] = useState<HandicapTier>(profile?.tier ?? "mid");
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weekly_goal ?? 4);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) return null;
  const tierInfo = TIER_INFO[profile.tier];

  function startEditing() {
    setUsername(profile!.username);
    setTier(profile!.tier);
    setWeeklyGoal(profile!.weekly_goal);
    setError(null);
    setEditing(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError("Username needs to be at least 3 characters.");
      return;
    }

    setSaving(true);
    if (trimmed.toLowerCase() !== profile!.username.toLowerCase() && (await isUsernameTaken(trimmed, profile!.id))) {
      setSaving(false);
      setError("That username is already taken -- try another.");
      return;
    }

    try {
      await updateProfile(profile!.id, { username: trimmed, tier, weekly_goal: weeklyGoal });
      await refreshProfile();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong -- try again.");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        <h1 className="font-display text-2xl tracking-wide">Edit Profile</h1>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
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
    </div>
  );
}
