import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import {
  completeRequest,
  createRequest,
  declineRequest,
  deleteRequest,
  getPerkCatalog,
  listCustomAskTemplates,
  listRequests,
  saveCustomAskTemplate,
  updateRequestPoints,
  updateRequestStatus,
} from "../../lib/api";
import { TIER_INFO, URGENCY_INFO, sortByUrgency } from "../../lib/askMeta";
import { guessEmoji } from "../../lib/emojiGuess";
import { getRoleCopy } from "../../lib/roleCopy";
import { SectionIntro } from "../../components/SectionIntro";
import type { AskUrgency, CustomAskTemplate, HouseholdRequest, PerkCatalogItem, RequestStatus, RequestTier } from "../../types";

type Filter = "for_me" | "from_me" | "all";

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
  declined: "Declined",
};

const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-200 text-neutral-600",
  declined: "bg-red-100 text-red-700",
};

function isTerminal(status: RequestStatus): boolean {
  return status === "done" || status === "cancelled" || status === "declined";
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}

const DEFAULT_POINTS_BY_TIER: Record<RequestTier, number> = { small: 5, medium: 10, large: 20 };

export function RequestsScreen() {
  const { profile } = useAuth();
  const { household, members, partner } = useHousehold();
  const [requests, setRequests] = useState<HouseholdRequest[]>([]);
  const [catalog, setCatalog] = useState<PerkCatalogItem[]>([]);
  const [templates, setTemplates] = useState<CustomAskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("for_me");
  const [showForm, setShowForm] = useState(false);

  const [selectedPerk, setSelectedPerk] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [note, setNote] = useState("");
  const [assignTo, setAssignTo] = useState<string>("");
  const [tier, setTier] = useState<RequestTier>("small");
  const [urgency, setUrgency] = useState<AskUrgency>("soon");
  const [points, setPoints] = useState(DEFAULT_POINTS_BY_TIER.small);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingPointsId, setEditingPointsId] = useState<string | null>(null);
  const [editPointsValue, setEditPointsValue] = useState(5);

  async function refresh() {
    if (!household) return;
    const [r, c, t] = await Promise.all([
      listRequests(household.id),
      getPerkCatalog(),
      listCustomAskTemplates(household.id, "request"),
    ]);
    setRequests(r);
    setCatalog(c);
    setTemplates(t);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [household]);

  useEffect(() => {
    if (partner) setAssignTo(partner.id);
  }, [partner]);

  if (!profile || !household) return null;

  const copy = getRoleCopy(profile.role);

  function memberName(id: string) {
    if (id === profile?.id) return "You";
    return members.find((m) => m.id === id)?.display_name ?? "Someone";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !household) return;
    const trimmedLabel = customLabel.trim();
    if (!selectedPerk && !trimmedLabel) {
      setError("Pick something from the menu or describe what you'd like.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const selectedCatalogItem = catalog.find((item) => item.key === selectedPerk);
      const label = selectedCatalogItem?.label ?? trimmedLabel;
      const emoji = selectedCatalogItem?.emoji ?? guessEmoji(trimmedLabel);

      await createRequest({
        householdId: household.id,
        requestedBy: profile.id,
        assignedTo: assignTo,
        perkKey: selectedPerk,
        customLabel: selectedPerk ? null : trimmedLabel,
        note: note.trim() || null,
        tier,
        urgency,
        points,
      });
      try {
        await saveCustomAskTemplate({
          householdId: household.id,
          kind: "request",
          label,
          emoji,
          tier,
          points,
        });
      } catch {
        // Saving/updating the remembered template is a convenience, not
        // critical -- the request itself already went through above.
      }
      setSelectedPerk(null);
      setCustomLabel("");
      setNote("");
      setTier("small");
      setUrgency("soon");
      setPoints(DEFAULT_POINTS_BY_TIER.small);
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(id: string, status: RequestStatus) {
    setActionError(null);
    try {
      await updateRequestStatus(id, status);
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't update that."));
    }
  }

  async function handleComplete(id: string) {
    setActionError(null);
    try {
      await completeRequest(id);
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't mark that done."));
    }
  }

  async function handleSavePoints(id: string) {
    setActionError(null);
    try {
      await updateRequestPoints(id, editPointsValue);
      setEditingPointsId(null);
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't save those points."));
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await deleteRequest(id);
      await refresh();
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't delete that."));
    }
  }

  async function handleDecline(id: string) {
    setActionError(null);
    try {
      await declineRequest(id, declineNote.trim() || null);
      setDecliningId(null);
      setDeclineNote("");
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't decline that."));
      return;
    }
    await refresh();
  }

  const filtered = sortByUrgency(
    requests.filter((r) => {
      if (filter === "for_me") return r.assigned_to === profile.id;
      if (filter === "from_me") return r.requested_by === profile.id;
      return true;
    })
  );

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <SectionIntro
        storageKey={`husband-app:intro:requests:${profile.id}`}
        emoji="☕"
        title={profile.role === "wife" ? "Make a request" : "You have a request"}
        body={
          profile.role === "wife"
            ? "Pick something from the menu or type your own, add a note for exactly how you want it, and send it straight to him. You'll see the status update in real time."
            : "When she needs something -- coffee, breakfast in bed, anything -- it'll show up here. Tap Start when you're on it, Mark done when it's delivered, or Decline with a quick reason if you can't."
        }
      />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Requests</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : copy.requestsButton}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="grid grid-cols-4 gap-2">
            {catalog.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSelectedPerk(item.key);
                  setCustomLabel("");
                  setTier(item.tier);
                  const remembered = templates.find((t) => t.label === item.label);
                  setPoints(remembered?.points ?? DEFAULT_POINTS_BY_TIER[item.tier]);
                }}
                className={`font-display flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-xs font-semibold ${
                  selectedPerk === item.key ? "border-brand bg-brand-light text-brand-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </div>

          {templates.length > 0 && (
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Your usual asks
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedPerk(null);
                      setCustomLabel(t.label);
                      if (t.tier) setTier(t.tier);
                      setPoints(t.points ?? DEFAULT_POINTS_BY_TIER[t.tier ?? "small"]);
                    }}
                    className={`font-display rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      customLabel === t.label ? "border-brand bg-brand-light text-brand-dark" : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Or something else
            </label>
            <input
              type="text"
              placeholder="Surprise me..."
              value={customLabel}
              onChange={(e) => {
                setCustomLabel(e.target.value);
                if (e.target.value) setSelectedPerk(null);
              }}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="Oat milk latte, extra hot"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              How big an ask
            </label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(Object.keys(TIER_INFO) as RequestTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`font-display rounded-md border px-2 py-2 text-xs font-semibold ${
                    tier === t ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {TIER_INFO[t].emoji} {TIER_INFO[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Points
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
            <p className="font-body mt-1 text-xs text-neutral-500">
              Remembered for next time -- edit it later if you want to change what it's worth.
            </p>
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              How urgent
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(Object.keys(URGENCY_INFO) as AskUrgency[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`font-display rounded-md border px-2 py-2 text-xs font-semibold ${
                    urgency === u ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                  }`}
                  title={URGENCY_INFO[u].hint}
                >
                  {URGENCY_INFO[u].emoji} {URGENCY_INFO[u].label}
                </button>
              ))}
            </div>
            <p className="font-body mt-1 text-xs text-neutral-500">{URGENCY_INFO[urgency].hint}</p>
          </div>

          {members.length > 2 && (
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Send to
              </label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                {members
                  .filter((m) => m.id !== profile.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !assignTo}
            className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send request"}
          </button>
        </form>
      )}

      <div className="mt-4 flex gap-2">
        {(["for_me", "from_me", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`font-display rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {f === "for_me" ? "For me" : f === "from_me" ? "From me" : "All"}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="font-body mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="font-body text-center text-neutral-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="font-body py-8 text-center text-neutral-500">{copy.requestsEmptyState}</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">
                    {r.perk_catalog ? `${r.perk_catalog.emoji} ${r.perk_catalog.label}` : r.custom_label}
                  </p>
                  {r.note && <p className="font-body mt-1 text-sm text-neutral-600">"{r.note}"</p>}
                  <p className="font-body mt-1 text-xs text-neutral-400">
                    {memberName(r.requested_by)} asked {memberName(r.assigned_to)}
                  </p>
                  {r.status === "declined" && r.decline_note && (
                    <p className="font-body mt-1 text-xs text-red-600">Declined: "{r.decline_note}"</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`font-display rounded-full px-2 py-0.5 text-xs font-semibold ${TIER_INFO[r.tier].className}`}>
                      {TIER_INFO[r.tier].emoji} {TIER_INFO[r.tier].label}
                    </span>
                    <span
                      className={`font-display rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY_INFO[r.urgency].className}`}
                      title={URGENCY_INFO[r.urgency].hint}
                    >
                      {URGENCY_INFO[r.urgency].emoji} {URGENCY_INFO[r.urgency].label}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {editingPointsId === r.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editPointsValue}
                        onChange={(e) => setEditPointsValue(Number(e.target.value))}
                        className="font-body w-14 rounded-md border border-neutral-300 px-1.5 py-0.5 text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePoints(r.id)}
                        className="font-display rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!(r.requested_by === profile.id && !isTerminal(r.status))}
                      onClick={() => {
                        setEditingPointsId(r.id);
                        setEditPointsValue(r.points);
                      }}
                      className="font-display rounded-full bg-gold/20 px-2.5 py-1 text-xs font-semibold text-gold disabled:cursor-default"
                    >
                      +{r.points} pts{r.requested_by === profile.id && !isTerminal(r.status) ? " ✎" : ""}
                    </button>
                  )}
                  <span className={`font-display rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              </div>

              {decliningId === r.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={declineNote}
                    onChange={(e) => setDeclineNote(e.target.value)}
                    className="font-body w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecline(r.id)}
                      className="font-display flex-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Confirm decline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDecliningId(null);
                        setDeclineNote("");
                        setActionError(null);
                      }}
                      className="font-display flex-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600"
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.assigned_to === profile.id && r.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleStatus(r.id, "in_progress")}
                      className="font-display rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800"
                    >
                      Start
                    </button>
                  )}
                  {r.assigned_to === profile.id && !isTerminal(r.status) && (
                    <button
                      type="button"
                      onClick={() => handleComplete(r.id)}
                      className="font-display rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800"
                    >
                      Mark done
                    </button>
                  )}
                  {r.assigned_to === profile.id && !isTerminal(r.status) && (
                    <button
                      type="button"
                      onClick={() => setDecliningId(r.id)}
                      className="font-display rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      Decline
                    </button>
                  )}
                  {(r.assigned_to === profile.id || r.requested_by === profile.id) && !isTerminal(r.status) && (
                    <button
                      type="button"
                      onClick={() => handleStatus(r.id, "cancelled")}
                      className="font-display rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600"
                    >
                      Cancel
                    </button>
                  )}
                  {r.requested_by === profile.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="font-display rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
