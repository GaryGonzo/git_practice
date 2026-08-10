import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import {
  createRequest,
  declineRequest,
  deleteRequest,
  getPerkCatalog,
  listCustomAskTemplates,
  listRequests,
  saveCustomAskTemplate,
  updateRequestStatus,
} from "../../lib/api";
import { TIER_INFO, URGENCY_INFO, sortByUrgency } from "../../lib/askMeta";
import { guessEmoji } from "../../lib/emojiGuess";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

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
      await createRequest({
        householdId: household.id,
        requestedBy: profile.id,
        assignedTo: assignTo,
        perkKey: selectedPerk,
        customLabel: selectedPerk ? null : trimmedLabel,
        note: note.trim() || null,
        tier,
        urgency,
      });
      if (!selectedPerk && trimmedLabel) {
        try {
          await saveCustomAskTemplate({
            householdId: household.id,
            kind: "request",
            label: trimmedLabel,
            emoji: guessEmoji(trimmedLabel),
            tier,
          });
        } catch {
          // Saving the quick-pick template is a convenience, not critical --
          // the request itself already went through above.
        }
      }
      setSelectedPerk(null);
      setCustomLabel("");
      setNote("");
      setTier("small");
      setUrgency("soon");
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(id: string, status: RequestStatus) {
    await updateRequestStatus(id, status);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteRequest(id);
    await refresh();
  }

  async function handleDecline(id: string) {
    await declineRequest(id, declineNote.trim() || null);
    setDecliningId(null);
    setDeclineNote("");
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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Requests</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : "New request"}
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

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="font-body text-center text-neutral-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="font-body py-8 text-center text-neutral-500">Nothing here yet.</p>
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
                <span className={`font-display shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
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
                      onClick={() => handleStatus(r.id, "done")}
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
