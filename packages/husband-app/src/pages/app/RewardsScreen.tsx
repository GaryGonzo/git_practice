import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import {
  approveReward,
  createReward,
  deleteReward,
  listPointsLedger,
  listRedemptions,
  listRewards,
  pointsSummaryForMember,
  redeemReward,
  updateReward,
} from "../../lib/api";
import { guessEmoji } from "../../lib/emojiGuess";
import { getRoleCopy } from "../../lib/roleCopy";
import { SectionIntro } from "../../components/SectionIntro";
import type { PointsLedgerEntry, Reward, RewardRedemption } from "../../types";

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function RewardsScreen() {
  const { profile } = useAuth();
  const { household, members } = useHousehold();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [pointCost, setPointCost] = useState(25);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("🎁");
  const [editPointCost, setEditPointCost] = useState(25);

  async function refresh() {
    if (!household) return;
    const [r, red, l] = await Promise.all([
      listRewards(household.id),
      listRedemptions(household.id),
      listPointsLedger(household.id),
    ]);
    setRewards(r);
    setRedemptions(red);
    setLedger(l);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [household]);

  if (!profile || !household) return null;

  const copy = getRoleCopy(profile.role);

  const husband = members.find((m) => m.role === "husband");
  const husbandSummary = husband ? pointsSummaryForMember(ledger, husband.id) : null;
  const mySummary = pointsSummaryForMember(ledger, profile.id);

  function memberName(id: string) {
    if (id === profile?.id) return "You";
    return members.find((m) => m.id === id)?.display_name ?? "Someone";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !household) return;
    const trimmed = label.trim();
    if (!trimmed || pointCost <= 0) {
      setError("Give the reward a name and a point cost above zero.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createReward({
        householdId: household.id,
        createdBy: profile.id,
        label: trimmed,
        emoji,
        pointCost,
      });
      setLabel("");
      setEmoji("🎁");
      setPointCost(25);
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that reward.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId);
    try {
      await redeemReward(rewardId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't redeem that.");
    } finally {
      setRedeemingId(null);
    }
  }

  async function handleDelete(rewardId: string) {
    setError(null);
    try {
      await deleteReward(rewardId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that.");
    }
  }

  function startEdit(reward: Reward) {
    setEditingRewardId(reward.id);
    setEditLabel(reward.label);
    setEditEmoji(reward.emoji);
    setEditPointCost(reward.point_cost);
  }

  async function handleSaveEdit(rewardId: string) {
    const trimmed = editLabel.trim();
    if (!trimmed || editPointCost <= 0) return;
    setError(null);
    try {
      await updateReward(rewardId, { label: trimmed, emoji: editEmoji, pointCost: editPointCost });
      setEditingRewardId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save those changes.");
    }
  }

  async function handleApprove(rewardId: string) {
    setError(null);
    try {
      await approveReward(rewardId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't approve that.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <SectionIntro
        storageKey={`husband-app:intro:rewards:${profile.id}`}
        emoji="🎁"
        title={copy.rewardsHeading}
        body={
          profile.role === "wife"
            ? "Add rewards for him to claim -- pre-planned or a special one-off. If he suggests his own reward idea, it'll show up here waiting on your approval before he can claim it."
            : "Already-set rewards are ready to claim any time you've got the points. Got something new in mind? Type it in with what you think it's worth -- she'll need to approve it before you can claim it."
        }
      />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Rewards</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : copy.rewardsCreateButton}
        </button>
      </div>

      {error && <p className="font-body mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {husband && husbandSummary && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            {husband.avatar_emoji} {husband.id === profile.id ? "Your points" : `${husband.display_name}'s points`}
          </p>
          <p className="font-body mt-2 text-sm text-neutral-700">
            You've earned <span className="font-semibold text-brand">{husbandSummary.earned}</span> points over all
            time. You have <span className="font-semibold text-brand">{husbandSummary.available}</span> points
            available to redeem. You've redeemed{" "}
            <span className="font-semibold text-brand">{husbandSummary.redeemed}</span> points on past redemptions.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              What is it
            </label>
            <input
              type="text"
              placeholder="Make a sandwich, golf with the boys..."
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setEmoji(guessEmoji(e.target.value));
              }}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-center text-lg"
              />
            </div>
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Point cost
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={pointCost}
                onChange={(e) => setPointCost(Number(e.target.value))}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>

          {profile.role === "husband" && (
            <p className="font-body text-xs text-neutral-500">
              She'll need to approve this before you can claim it.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save reward"}
          </button>
        </form>
      )}

      <div className="mt-6">
        <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Catalog</p>
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="font-body text-center text-neutral-500">Loading…</p>
          ) : rewards.length === 0 ? (
            <p className="font-body py-4 text-sm text-neutral-500">No rewards set up yet -- add one above.</p>
          ) : (
            rewards.map((reward) =>
              editingRewardId === reward.id ? (
                <div key={reward.id} className="space-y-2 rounded-xl border border-brand/40 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="font-body w-12 rounded-md border border-neutral-300 px-2 py-1.5 text-center text-lg"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="font-body flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={editPointCost}
                      onChange={(e) => setEditPointCost(Number(e.target.value))}
                      className="font-body w-24 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                    />
                    <span className="font-body text-xs text-neutral-500">points</span>
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingRewardId(null)}
                        className="font-display rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(reward.id)}
                        className="font-display rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={reward.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.emoji}</span>
                    <div>
                      <p className="font-display text-sm font-semibold">{reward.label}</p>
                      <p className="font-body text-xs text-neutral-500">
                        {reward.point_cost} points
                        {reward.status === "pending" && " -- awaiting approval"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reward.status === "pending" ? (
                      profile.role === "wife" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(reward.id)}
                          className="font-display rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800"
                        >
                          Approve
                        </button>
                      )
                    ) : (
                      profile.role === "husband" && (
                        <button
                          type="button"
                          disabled={redeemingId === reward.id || mySummary.available < reward.point_cost}
                          onClick={() => handleRedeem(reward.id)}
                          className="font-display bg-brand rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          {redeemingId === reward.id ? "Claiming…" : copy.rewardsRedeemCta}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(reward)}
                      className="font-display rounded-full bg-neutral-100 px-2 py-1.5 text-xs font-semibold text-neutral-600"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reward.id)}
                      className="font-display rounded-full bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">History</p>
        <div className="mt-2 space-y-2">
          {redemptions.length === 0 ? (
            <p className="font-body py-4 text-sm text-neutral-500">Nothing redeemed yet.</p>
          ) : (
            redemptions.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-body text-neutral-700">{r.label}</p>
                  <p className="font-body text-xs text-neutral-400">
                    {memberName(r.redeemed_by)} · {timeAgo(r.created_at)}
                  </p>
                </div>
                <span className="font-display font-semibold text-red-500">-{r.points_spent}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
