import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import {
  approveReward,
  createReward,
  deleteReward,
  getRewardCatalog,
  listCustomAskTemplates,
  listPointsLedger,
  listRedemptions,
  listRewards,
  pointsSummaryForMember,
  redeemReward,
  saveCustomAskTemplate,
  updateReward,
} from "../../lib/api";
import { guessEmoji } from "../../lib/emojiGuess";
import { getRoleCopy } from "../../lib/roleCopy";
import { SectionIntro } from "../../components/SectionIntro";
import { CREATE_NEW_KEY, PresetList, type PresetListItem } from "../../components/PresetList";
import type { CustomAskTemplate, PointsLedgerEntry, Reward, RewardCatalogItem, RewardRedemption } from "../../types";

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
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [templates, setTemplates] = useState<CustomAskTemplate[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [pointCost, setPointCost] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("🎁");
  const [editPointCost, setEditPointCost] = useState(25);

  async function refresh() {
    if (!household) return;
    const [r, c, tpl, red, l] = await Promise.all([
      listRewards(household.id),
      getRewardCatalog(),
      listCustomAskTemplates(household.id, "reward"),
      listRedemptions(household.id),
      listPointsLedger(household.id),
    ]);
    setRewards(r);
    setCatalog(c);
    setTemplates(tpl);
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

  function handlePickNew() {
    setPickerKey(CREATE_NEW_KEY);
    setLabel("");
    setEmoji("🎁");
    setPointCost("");
  }

  function handlePickItem(item: PresetListItem) {
    setPickerKey(item.key);
    setLabel(item.label);
    setEmoji(item.emoji);
    const remembered = templates.find((t) => t.label === item.label);
    setPointCost(remembered?.points ?? "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !household) return;
    const trimmed = label.trim();
    if (!pickerKey) {
      setError("Pick something from the list.");
      return;
    }
    if (pickerKey === CREATE_NEW_KEY && !trimmed) {
      setError("Give the reward a name.");
      return;
    }
    if (pointCost === "" || pointCost <= 0) {
      setError("Set how many points this is worth.");
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
      try {
        await saveCustomAskTemplate({
          householdId: household.id,
          kind: "reward",
          label: trimmed,
          emoji,
          points: pointCost,
        });
      } catch {
        // Convenience only -- the reward itself already saved above.
      }
      setPickerKey(null);
      setLabel("");
      setEmoji("🎁");
      setPointCost("");
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

  const catalogLabels = new Set(catalog.map((c) => c.label));
  const createdLabels = new Set(rewards.map((r) => r.label));
  const sortedRewards = [...rewards].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const uninstantiatedPresets = catalog.filter((c) => !createdLabels.has(c.label));
  const pickerItems: PresetListItem[] = [
    ...catalog.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji })),
    ...templates.filter((t) => !catalogLabels.has(t.label)).map((t) => ({ key: `tpl:${t.id}`, label: t.label, emoji: t.emoji })),
  ];

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
      <h1 className="font-display text-3xl">Rewards</h1>

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

      <div className="mt-6 flex items-center justify-between">
        <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Create new reward</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : copy.rewardsCreateButton}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              What is it
            </label>
            <div className="mt-1">
              <PresetList term="reward" items={pickerItems} selectedKey={pickerKey} onSelectNew={handlePickNew} onSelectItem={handlePickItem} />
            </div>
          </div>

          {pickerKey === CREATE_NEW_KEY && (
            <div className="grid grid-cols-4 gap-2">
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
              <div className="col-span-3">
                <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  Name it
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
                  autoFocus
                />
              </div>
            </div>
          )}

          {pickerKey && (
          <>
          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Point cost
            </label>
            <input
              type="number"
              min={1}
              max={100000}
              value={pointCost}
              onChange={(e) => setPointCost(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Worth?"
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
            <p className="font-body mt-1 text-xs text-neutral-500">
              Remembered for next time -- edit it later if you want to change what it's worth.
            </p>
          </div>

          {profile.role === "husband" && (
            <p className="font-body text-xs text-neutral-500">
              She'll need to approve this before you can claim it.
            </p>
          )}
          </>
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
        {loading ? (
          <p className="font-body mt-2 text-center text-neutral-500">Loading…</p>
        ) : sortedRewards.length === 0 && uninstantiatedPresets.length === 0 ? (
          <p className="font-body py-4 text-sm text-neutral-500">No rewards set up yet -- add one above.</p>
        ) : (
          <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
            {sortedRewards.map((reward) =>
              editingRewardId === reward.id ? (
                <div key={reward.id} className="w-40 shrink-0 space-y-2 rounded-xl border border-brand/40 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="font-body w-10 rounded-md border border-neutral-300 px-1.5 py-1.5 text-center text-lg"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="font-body min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={editPointCost}
                    onChange={(e) => setEditPointCost(Number(e.target.value))}
                    className="font-body w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingRewardId(null)}
                      className="font-display flex-1 rounded-full bg-neutral-100 px-2 py-1.5 text-xs font-semibold text-neutral-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(reward.id)}
                      className="font-display flex-1 rounded-full bg-green-100 px-2 py-1.5 text-xs font-semibold text-green-800"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div key={reward.id} className="w-40 shrink-0 rounded-xl border border-neutral-200 bg-white p-3">
                  <span className="text-2xl">{reward.emoji}</span>
                  <p className="font-display mt-1 text-sm font-semibold leading-tight">{reward.label}</p>
                  <p className="font-body mt-0.5 text-xs text-neutral-500">
                    {reward.point_cost} points
                    {reward.status === "pending" && " -- awaiting approval"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reward.status === "pending"
                      ? profile.role === "wife" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(reward.id)}
                            className="font-display rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"
                          >
                            Approve
                          </button>
                        )
                      : profile.role === "husband" && (
                          <button
                            type="button"
                            disabled={redeemingId === reward.id || mySummary.available < reward.point_cost}
                            onClick={() => handleRedeem(reward.id)}
                            className="font-display bg-brand rounded-full px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            {redeemingId === reward.id ? "Claiming…" : copy.rewardsRedeemCta}
                          </button>
                        )}
                    <button
                      type="button"
                      onClick={() => startEdit(reward)}
                      className="font-display rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reward.id)}
                      className="font-display rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            )}
            {uninstantiatedPresets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => {
                  setShowForm(true);
                  handlePickItem({ key: preset.key, label: preset.label, emoji: preset.emoji });
                }}
                className="w-40 shrink-0 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-left"
              >
                <span className="text-2xl">{preset.emoji}</span>
                <p className="font-display mt-1 text-sm font-semibold leading-tight text-neutral-600">{preset.label}</p>
                <p className="font-body mt-1 text-xs text-brand">+ Add this</p>
              </button>
            ))}
          </div>
        )}
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
