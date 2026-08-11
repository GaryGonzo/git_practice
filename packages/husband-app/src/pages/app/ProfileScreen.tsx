import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import { awardBonusPoints, listPointsLedger, totalsByMember, uploadAvatar } from "../../lib/api";
import { PointsSummary } from "../../components/PointsSummary";
import { Avatar } from "../../components/Avatar";
import type { PointsLedgerEntry } from "../../types";

const ADMIN_EMAIL = "garygonzo.gg@gmail.com";

export function ProfileScreen() {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const { household, members, partner } = useHousehold();
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(10);
  const [bonusReason, setBonusReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    if (!household) return;
    setLedger(await listPointsLedger(household.id));
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [household]);

  if (!profile || !household) return null;

  const totals = totalsByMember(ledger);

  async function handleCopy() {
    await navigator.clipboard.writeText(household!.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleBonus(event: React.FormEvent) {
    event.preventDefault();
    if (!partner || !bonusReason.trim()) return;
    setSubmitting(true);
    try {
      await awardBonusPoints(household!.id, partner.id, bonusPoints, bonusReason.trim());
      setBonusReason("");
      setShowBonus(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function memberName(id: string) {
    if (id === profile?.id) return "You";
    return members.find((m) => m.id === id)?.display_name ?? "Someone";
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      await uploadAvatar(profile.id, file);
      await refreshProfile();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="relative shrink-0"
          aria-label="Change photo"
        >
          <Avatar profile={profile} size={56} />
          <span className="font-display absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-white">
            📷
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        <h1 className="font-display text-3xl">{profile.display_name}</h1>
      </div>
      {uploadingPhoto && <p className="font-body mt-1 text-xs text-neutral-500">Uploading…</p>}
      {photoError && <p className="font-body mt-1 text-xs text-red-600">{photoError}</p>}

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Household</p>
        <p className="font-display mt-1 text-lg font-semibold">{household.name}</p>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <span className="font-display text-sm tracking-widest">{household.invite_code}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="font-display rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="font-body mt-2 text-xs text-neutral-500">Share this code so your partner can join.</p>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Points</p>
        <div className="mt-3">
          <PointsSummary members={members} totals={totals} meId={profile.id} />
        </div>

        {partner && (
          <div className="mt-4">
            {!showBonus ? (
              <button
                type="button"
                onClick={() => setShowBonus(true)}
                className="font-display w-full rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand"
              >
                🎁 Award bonus points to {partner.display_name}
              </button>
            ) : (
              <form onSubmit={handleBonus} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(Number(e.target.value))}
                    className="font-body rounded-md border border-neutral-300 px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="For being amazing"
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    className="font-body rounded-md border border-neutral-300 px-3 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="font-display bg-brand flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBonus(false)}
                    className="font-display flex-1 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">History</p>
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="font-body text-center text-neutral-500">Loading…</p>
          ) : ledger.length === 0 ? (
            <p className="font-body text-sm text-neutral-500">No points yet -- complete a task to get started.</p>
          ) : (
            ledger.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-body text-neutral-700">{entry.reason}</p>
                  <p className="font-body text-xs text-neutral-400">{memberName(entry.member_id)}</p>
                </div>
                <span className="font-display font-semibold text-brand">+{entry.points}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {session?.user.email === ADMIN_EMAIL && (
        <Link
          to="/app/admin"
          className="font-body mt-6 block w-full text-center text-sm text-neutral-400 underline"
        >
          Admin
        </Link>
      )}

      <button
        type="button"
        onClick={() => signOut()}
        className="font-body mt-6 block w-full text-center text-sm text-neutral-400 underline"
      >
        Sign out
      </button>
    </div>
  );
}
