import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HANDICAP_TIERS,
  TIER_INFO,
  SKILL_CATEGORIES,
  CATEGORY_INFO,
  type HandicapTier,
  type SkillCategory,
} from "@golfable/shared";
import { useAuth, type Profile } from "../../lib/AuthProvider";
import {
  updateProfile,
  uploadAvatar,
  getAvatarSignedUrl,
  getStudioByOwnerId,
  assignIndividualTier,
  createCheckoutSession,
  createPortalSession,
  leaveStudio,
  getLatestHandicap,
  getHandicapHistory,
  logHandicap,
  isHandicapUpdateDue,
  getMyGameRatings,
  setGameRating,
  getMyBag,
  type HandicapEntry,
  type Studio,
} from "../../lib/golfableApi";
import { HandicapTrendChart } from "../../components/HandicapTrendChart";
import { FairwayPanel, Section, Panel, Row, IconDot, ChevronRight } from "../../components/ui";
import { NotificationPrompt } from "../../components/NotificationPrompt";
import { PUSH_ENABLED_KEY } from "../../lib/push";

const NOTIF_PROMPT_VIEWS_KEY = "golfable_profile_notif_views";
const NOTIF_PROMPT_MAX_VIEWS = 5;

function ProfileNotificationBanner({ profile }: { profile: Profile }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Once subscribed this is no longer a nag -- it's the permanent
    // "notifications are on, send a test" status row, so it stays visible
    // regardless of the view-count cap below (that cap only limits how
    // many times we ask someone who hasn't subscribed yet).
    if (localStorage.getItem(PUSH_ENABLED_KEY) === "true") {
      setVisible(true);
      return;
    }
    const views = Number(localStorage.getItem(NOTIF_PROMPT_VIEWS_KEY) ?? "0");
    if (views >= NOTIF_PROMPT_MAX_VIEWS) return;
    localStorage.setItem(NOTIF_PROMPT_VIEWS_KEY, String(views + 1));
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    // empty:hidden -- the prompt renders nothing on browsers without push,
    // and the card shouldn't sit there blank.
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] empty:hidden">
      <NotificationPrompt profile={profile} onSubscribed={() => setVisible(false)} />
    </div>
  );
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7l1 1.5h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AvatarUploader({ profile, onUploaded, compact = false }: { profile: Profile; onUploaded: () => Promise<void>; compact?: boolean }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!profile.avatar_path) {
      setAvatarUrl(null);
      return;
    }
    getAvatarSignedUrl(profile.avatar_path).then((url) => {
      if (!cancelled) setAvatarUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.avatar_path]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("That image is too large -- please choose one under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await uploadAvatar(profile.id, file);
      await onUploaded();
    } catch {
      setError("Couldn't upload that photo -- try again.");
    }
    setUploading(false);
  }

  const size = compact ? "h-20 w-20" : "h-24 w-24";
  return (
    <div className={compact ? "flex-none" : "mt-4 flex flex-col items-center"}>
      <label className={`relative block cursor-pointer ${size}`}>
        <div className={`overflow-hidden rounded-full bg-neutral-100 ${size} ${compact ? "ring-gold/60 ring-2" : "border-brand/20 border-2"}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your profile" className="h-full w-full object-cover" />
          ) : (
            <div className="font-display bg-brand flex h-full w-full items-center justify-center text-3xl text-white/80">
              {profile.first_name.charAt(0)}
              {profile.last_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="bg-gold text-brand-dark absolute -right-0.5 -bottom-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white">
          <CameraIcon className="h-3.5 w-3.5" />
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} aria-label="Change profile photo" />
      </label>
      {!compact && <p className="font-body mt-2 text-xs text-neutral-500">{uploading ? "Uploading…" : "Only you can see this photo"}</p>}
      {compact && uploading && <p className="font-body mt-1 text-center text-xs text-white/70">Uploading…</p>}
      {error && <p className={`font-body mt-1 text-xs ${compact ? "text-gold" : "text-red-600"}`}>{error}</p>}
    </div>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="7" y="7" width="10" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7V4.5M12 7V3M15 7V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2 2-5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.28-4.32h-3.14v14.6a2.6 2.6 0 1 1-2.6-2.6c.28 0 .55.04.8.12V10.5a5.75 5.75 0 1 0 5 5.7V9.4a7.4 7.4 0 0 0 4.3 1.37V7.6a4.3 4.3 0 0 1-1.08-1.78Z" />
    </svg>
  );
}

// Both fields represent "how many strokes over/under" in spirit -- lower is
// always better, whichever one a given entry used.
function handicapEntryValue(entry: HandicapEntry): number {
  return entry.handicapIndex ?? entry.avgScorePar72!;
}

function DeltaBadge({ history }: { history: HandicapEntry[] }) {
  if (history.length < 2) return null;
  const delta = handicapEntryValue(history[history.length - 1]) - handicapEntryValue(history[0]);
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return <span className="font-label text-sm font-semibold text-neutral-500">(no change)</span>;
  const improved = rounded < 0;
  return (
    <span className={`font-label text-sm font-semibold ${improved ? "text-brand" : "text-fit-circuit"}`}>
      {improved ? `Down ${Math.abs(rounded)}` : `Up ${rounded}`} since your first entry
    </span>
  );
}

function HandicapSection({ profile }: { profile: Profile }) {
  const [latest, setLatest] = useState<HandicapEntry | null | undefined>(undefined);
  const [history, setHistory] = useState<HandicapEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"handicap" | "avgScore">("handicap");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLatestHandicap(profile.id).then(setLatest);
    getHandicapHistory(profile.id).then(setHistory);
  }, [profile.id]);

  if (latest === undefined) return null;
  const due = isHandicapUpdateDue(latest);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const num = Number(value);
    if (!Number.isFinite(num)) {
      setError("Enter a number.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await logHandicap(profile.id, mode === "handicap" ? num : null, mode === "avgScore" ? num : null);
      setLatest(await getLatestHandicap(profile.id));
      setHistory(await getHandicapHistory(profile.id));
      setEditing(false);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that -- try again.");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
      <p className="font-label text-lg font-semibold text-neutral-900">Handicap</p>
      {latest ? (
        <div className="mt-1">
          <p className="font-display text-5xl leading-none">
            {latest.handicapIndex !== null ? latest.handicapIndex : latest.avgScorePar72}
            <span className="font-label ml-1.5 text-base font-semibold text-neutral-400">
              {latest.handicapIndex !== null ? "index" : "avg score (par 72)"}
            </span>
          </p>
          <div className="mt-1">
            <DeltaBadge history={history} />
          </div>
        </div>
      ) : (
        <p className="font-body mt-1 text-sm text-neutral-500">Not set yet.</p>
      )}
      {history.length > 3 && <HandicapTrendChart points={history.map((h) => ({ value: handicapEntryValue(h), recordedAt: h.recordedAt }))} />}
      {due && !editing && (
        <p className="font-body mt-1 text-sm text-gold">
          {latest ? "Time for your monthly update." : "Add yours so we can track your improvement over time."}
        </p>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="mt-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("handicap")}
              className={`font-label flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${
                mode === "handicap" ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
              }`}
            >
              I have a handicap
            </button>
            <button
              type="button"
              onClick={() => setMode("avgScore")}
              className={`font-label flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${
                mode === "avgScore" ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
              }`}
            >
              Avg score (par 72)
            </button>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "handicap" ? "e.g. 12.4" : "e.g. 92"}
            className="font-body w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-label flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !value}
              className="font-label bg-brand flex-1 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-label bg-brand/10 text-brand mt-3 rounded-full px-4 py-1.5 text-sm font-bold"
        >
          {latest ? "Update handicap" : "Add your handicap"}
        </button>
      )}
    </div>
  );
}

function GameRatingRow({
  profileId,
  category,
  rating,
}: {
  profileId: string;
  category: SkillCategory;
  rating: number | undefined;
}) {
  const [value, setValue] = useState(rating === undefined ? "" : String(rating));
  const [saved, setSaved] = useState(false);

  async function handleBlur() {
    const trimmed = value.trim();
    if (trimmed === "") return;
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 1 || num > 10) return;
    await setGameRating(profileId, category, num);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-0">
      <p className="font-label text-[1.05rem] font-semibold text-neutral-800">{CATEGORY_INFO[category].label}</p>
      <div className="flex items-center gap-2">
        {saved && <span className="font-body text-xs text-neutral-400">Saved</span>}
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="-/10"
          className="font-display focus:border-brand w-16 rounded-lg border border-neutral-300 px-2 py-1 text-right text-xl outline-none"
        />
      </div>
    </div>
  );
}

function GameRatingSection({ profile }: { profile: Profile }) {
  const [ratings, setRatings] = useState<Partial<Record<SkillCategory, number>> | null>(null);

  useEffect(() => {
    getMyGameRatings(profile.id).then(setRatings);
  }, [profile.id]);

  if (!ratings) return null;

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
      <p className="font-label text-lg font-semibold text-neutral-900">How each club feels</p>
      <p className="font-body mt-1 text-sm text-neutral-500">
        Your gut read, 1 to 10. The Library uses it to pick drills for you.
      </p>
      <div className="mt-2">
        {SKILL_CATEGORIES.map((category) => (
          <GameRatingRow key={category} profileId={profile.id} category={category} rating={ratings[category]} />
        ))}
      </div>
    </div>
  );
}

const TIER_PRICE_LABEL: Record<string, string> = {
  tier_799: "$7.99/mo",
  tier_1499: "$14.99/mo",
  tier_1999: "$19.99/mo",
};

function SubscriptionSection({
  profile,
  accessToken,
  onRefresh,
}: {
  profile: Profile;
  accessToken: string;
  onRefresh: () => Promise<void>;
}) {
  const [tier, setTier] = useState<string | null>(profile.individual_tier);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [sharingPublicly, setSharingPublicly] = useState(profile.share_scores_publicly);
  const [sharingBusy, setSharingBusy] = useState(false);

  useEffect(() => {
    if (profile.studio_id || profile.individual_tier) return;
    assignIndividualTier(profile.id).then(setTier);
  }, [profile.id, profile.studio_id, profile.individual_tier]);

  async function handleLeave() {
    setLeaving(true);
    setError(null);
    try {
      await leaveStudio();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't leave the studio -- try again.");
    }
    setLeaving(false);
  }

  async function handleTogglePublicSharing(checked: boolean) {
    setSharingPublicly(checked);
    setSharingBusy(true);
    try {
      await updateProfile(profile.id, { share_scores_publicly: checked });
      await onRefresh();
    } catch {
      setSharingPublicly(!checked);
    }
    setSharingBusy(false);
  }

  if (profile.studio_id) {
    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
        <p className="font-label text-lg font-semibold text-neutral-900">Membership</p>
        <p className="font-body mt-1 text-sm text-neutral-700">Your studio covers your access -- no billing needed.</p>
        <label className="font-body mt-3 flex items-start gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={sharingPublicly}
            disabled={sharingBusy}
            onChange={(e) => handleTogglePublicSharing(e.target.checked)}
            className="mt-0.5"
          />
          Also show my scores on the public Golfable leaderboard
        </label>
        <p className="font-body mt-1 text-xs text-neutral-400">
          Your studio's private leaderboard always has your scores -- this is only about the public one.
        </p>
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="font-label mt-3 text-sm font-semibold text-red-600 underline disabled:opacity-60"
        >
          {leaving ? "Leaving…" : "Leave studio"}
        </button>
        {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (!tier || tier === "free") {
    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
        <p className="font-label text-lg font-semibold text-neutral-900">Membership</p>
        <p className="font-body mt-1 text-sm text-neutral-700">
          {tier === "free" ? "Founding member -- free forever." : "Loading…"}
        </p>
      </div>
    );
  }

  async function handleAction() {
    setBusy(true);
    setError(null);
    try {
      const url =
        profile.subscription_status === "active"
          ? await createPortalSession(accessToken)
          : await createCheckoutSession(accessToken);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong -- try again.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
      <p className="font-label text-lg font-semibold text-neutral-900">Membership</p>
      <p className="font-body mt-1 text-sm text-neutral-700">
        {profile.subscription_status === "active"
          ? `Active -- ${TIER_PRICE_LABEL[tier]}`
          : `${TIER_PRICE_LABEL[tier]} -- not yet subscribed`}
      </p>
      {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleAction}
        disabled={busy}
        className="font-label bg-brand mt-3 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Redirecting…" : profile.subscription_status === "active" ? "Manage Billing" : "Subscribe"}
      </button>
    </div>
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

export function ProfileScreen() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [tier, setTier] = useState<HandicapTier>(profile?.tier ?? "mid");
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weekly_goal ?? 4);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [ownedStudio, setOwnedStudio] = useState<Studio | null>(null);
  const [hasBagSet, setHasBagSet] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getStudioByOwnerId(profile.id).then(setOwnedStudio);
    getMyBag(profile.id).then((bag) => setHasBagSet(bag.some((entry) => entry.yardage !== null)));
  }, [profile]);

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
      <div className="mx-auto max-w-md px-4 pt-5 pb-28">
        <h1 className="font-display text-[2.4rem] leading-none tracking-wide">Edit profile</h1>
        <AvatarUploader profile={profile} onUploaded={refreshProfile} />

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label text-base font-semibold text-neutral-700">
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
              <label className="font-label text-base font-semibold text-neutral-700">
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
            <label className="font-label text-base font-semibold text-neutral-700">
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
            <label className="font-label text-base font-semibold text-neutral-700">
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
    <div className="mx-auto max-w-md px-4 pb-28">
      <FairwayPanel className="mt-5">
        <div className="flex items-center gap-4 p-5">
          <AvatarUploader profile={profile} onUploaded={refreshProfile} compact />
          <div className="min-w-0">
            <h1 className="font-display truncate text-[2.4rem] leading-none tracking-wide">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="font-label mt-1 text-base font-medium text-white/70">
              {tierInfo.label} tier, member since {formatMemberSince(profile.created_at)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10">
          <div className="px-5 py-3">
            <p className="font-display text-gold text-3xl leading-none">{profile.weekly_goal}</p>
            <p className="font-label text-sm font-medium text-white/60">Golfables a week</p>
          </div>
          <button type="button" onClick={startEditing} className="border-l border-white/10 px-5 py-3 text-left active:bg-white/5">
            <p className="font-label text-lg leading-tight font-semibold">Edit profile</p>
            <p className="font-label text-sm font-medium text-white/60">Name, tier, weekly goal</p>
          </button>
        </div>
      </FairwayPanel>

      <ProfileNotificationBanner profile={profile} />

      <Section title="Your game">
        <div className="space-y-3">
          <HandicapSection profile={profile} />
          <GameRatingSection profile={profile} />
          <Panel>
            <Row
              to="/app/bag"
              icon={<IconDot><BagIcon className="h-5 w-5" /></IconDot>}
              title="My bag"
              sub={hasBagSet ? "Yardages set for club picks" : "Add yardages for club picks on drills"}
            />
          </Panel>
        </div>
      </Section>

      <Section title="Account">
        <div className="space-y-3">
          {session && <SubscriptionSection profile={profile} accessToken={session.access_token} onRefresh={refreshProfile} />}
          {(ownedStudio || profile.is_admin) && (
            <Panel>
              {ownedStudio && <Row to="/app/studio-admin" title={`Manage ${ownedStudio.name}`} sub="Your studio's players and billing" />}
              {profile.is_admin && <Row to="/app/admin" title="Admin dashboard" sub="Players, drills and signups" />}
            </Panel>
          )}
        </div>
      </Section>

      <Section title="Community">
        <Panel>
          <a
            href={`https://www.tiktok.com/@${TIKTOK_HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-neutral-50"
          >
            <IconDot className="bg-neutral-900 text-white"><TikTokIcon className="h-5 w-5" /></IconDot>
            <span className="min-w-0 flex-1">
              <span className="font-label block text-[1.05rem] leading-tight font-semibold">Follow @{TIKTOK_HANDLE}</span>
              <span className="font-body block text-sm text-neutral-500">Drill videos and real attempts on TikTok</span>
            </span>
            <ChevronRight className="h-4 w-4 flex-none text-neutral-300" />
          </a>
          <a
            href="https://www.facebook.com/groups/golfable"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-neutral-50"
          >
            <IconDot className="bg-[#1877F2] text-white"><FacebookIcon className="h-5 w-5" /></IconDot>
            <span className="min-w-0 flex-1">
              <span className="font-label block text-[1.05rem] leading-tight font-semibold">Join the Facebook group</span>
              <span className="font-body block text-sm text-neutral-500">Share scores and swap tips</span>
            </span>
            <ChevronRight className="h-4 w-4 flex-none text-neutral-300" />
          </a>
          <button type="button" onClick={revealSurprise} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50">
            <IconDot className="bg-gold/15 text-gold"><SparkIcon className="h-5 w-5" /></IconDot>
            <span className="min-w-0 flex-1">
              <span className="font-label block text-[1.05rem] leading-tight font-semibold">{surprise ? "Another one" : "Need a pep talk?"}</span>
              <span className="font-body block text-sm text-neutral-600">{surprise ?? "Tap for a little golf wisdom"}</span>
            </span>
          </button>
        </Panel>
      </Section>

      <button
        type="button"
        onClick={handleSignOut}
        className="font-label mt-8 w-full rounded-2xl bg-white py-3.5 text-base font-semibold text-red-600 ring-1 ring-black/[0.06] active:bg-neutral-50"
      >
        Sign out
      </button>
    </div>
  );
}
