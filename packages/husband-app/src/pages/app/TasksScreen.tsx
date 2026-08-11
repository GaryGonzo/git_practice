import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import {
  completeTask,
  createTask,
  declineTask,
  deleteTask,
  listCustomAskTemplates,
  listTasks,
  saveCustomAskTemplate,
  updateTaskStatus,
} from "../../lib/api";
import { URGENCY_INFO, sortByUrgency } from "../../lib/askMeta";
import { guessEmoji } from "../../lib/emojiGuess";
import { getRoleCopy } from "../../lib/roleCopy";
import { SectionIntro } from "../../components/SectionIntro";
import type { AskUrgency, CustomAskTemplate, HouseholdTask, TaskStatus } from "../../types";

type Filter = "for_me" | "from_me" | "all";

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "Accepted",
  done: "Done",
  declined: "Declined",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

function isTerminal(status: TaskStatus): boolean {
  return status === "done" || status === "declined";
}

export function TasksScreen() {
  const { profile } = useAuth();
  const { household, members, partner } = useHousehold();
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [templates, setTemplates] = useState<CustomAskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("for_me");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [assignTo, setAssignTo] = useState<string>("");
  const [urgency, setUrgency] = useState<AskUrgency>("soon");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");
  const [declineError, setDeclineError] = useState<string | null>(null);

  async function refresh() {
    if (!household) return;
    const [t, templatesList] = await Promise.all([
      listTasks(household.id),
      listCustomAskTemplates(household.id, "task"),
    ]);
    setTasks(t);
    setTemplates(templatesList);
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

  function memberName(id: string | null) {
    if (!id) return "Anyone";
    if (id === profile?.id) return "You";
    return members.find((m) => m.id === id)?.display_name ?? "Someone";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !household) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give the task a title.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createTask({
        householdId: household.id,
        createdBy: profile.id,
        assignedTo: assignTo || null,
        title: trimmedTitle,
        description: description.trim() || null,
        points,
        urgency,
      });
      try {
        await saveCustomAskTemplate({
          householdId: household.id,
          kind: "task",
          label: trimmedTitle,
          emoji: guessEmoji(trimmedTitle),
          points,
        });
      } catch {
        // Convenience only -- the task itself already saved above.
      }
      setTitle("");
      setDescription("");
      setPoints(5);
      setUrgency("soon");
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that task.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(id: string) {
    await completeTask(id);
    await refresh();
  }

  async function handleStart(id: string) {
    await updateTaskStatus(id, "in_progress");
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    await refresh();
  }

  async function handleDecline(id: string) {
    setDeclineError(null);
    try {
      await declineTask(id, declineNote.trim() || null);
      setDecliningId(null);
      setDeclineNote("");
      await refresh();
    } catch (err) {
      setDeclineError(err instanceof Error ? err.message : "Couldn't decline that.");
    }
  }

  const filtered = sortByUrgency(
    tasks.filter((t) => {
      if (filter === "for_me") return t.assigned_to === profile.id;
      if (filter === "from_me") return t.created_by === profile.id;
      return true;
    })
  );

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <SectionIntro
        storageKey={`husband-app:intro:tasks:${profile.id}`}
        emoji="✅"
        title={profile.role === "wife" ? "Assign a new to-do item" : "New to-do item"}
        body={
          profile.role === "wife"
            ? "Add chores and attach points to them. He'll see them here, and you'll both watch the points add up as he clears them."
            : "Chores land here with points attached. Accept it, finish it, or decline it with a reason if you're not able to get to it."
        }
      />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Tasks</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : copy.tasksButton}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          {templates.length > 0 && (
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Your usual tasks
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTitle(t.label);
                      if (t.points != null) setPoints(t.points);
                    }}
                    className={`font-display rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      title === t.label ? "border-brand bg-brand-light text-brand-dark" : "border-neutral-200 text-neutral-600"
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
              Title
            </label>
            <input
              type="text"
              placeholder="Take out the garbage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Details (optional)
            </label>
            <input
              type="text"
              placeholder="Bins go out Tuesday night"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Points
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Assign to
              </label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                <option value="">Anyone</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === profile.id ? "You" : m.display_name}
                  </option>
                ))}
              </select>
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

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add task"}
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
          <p className="font-body py-8 text-center text-neutral-500">{copy.tasksEmptyState}</p>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">{t.title}</p>
                  {t.description && <p className="font-body mt-1 text-sm text-neutral-600">{t.description}</p>}
                  <p className="font-body mt-1 text-xs text-neutral-400">
                    {memberName(t.created_by)} assigned {memberName(t.assigned_to)}
                  </p>
                  {t.status === "declined" && t.decline_note && (
                    <p className="font-body mt-1 text-xs text-red-600">Declined: "{t.decline_note}"</p>
                  )}
                  <span
                    className={`font-display mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY_INFO[t.urgency].className}`}
                    title={URGENCY_INFO[t.urgency].hint}
                  >
                    {URGENCY_INFO[t.urgency].emoji} {URGENCY_INFO[t.urgency].label}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-display rounded-full bg-gold/20 px-2.5 py-1 text-xs font-semibold text-gold">
                    +{t.points} pts
                  </span>
                  <span className={`font-display rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
              </div>

              {decliningId === t.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Reason (optional) -- already left for work, etc."
                    value={declineNote}
                    onChange={(e) => setDeclineNote(e.target.value)}
                    className="font-body w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  {declineError && <p className="font-body text-xs text-red-600">{declineError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecline(t.id)}
                      className="font-display flex-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Confirm decline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDecliningId(null);
                        setDeclineNote("");
                        setDeclineError(null);
                      }}
                      className="font-display flex-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600"
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.status === "open" && (t.assigned_to === profile.id || !t.assigned_to) && (
                    <button
                      type="button"
                      onClick={() => handleStart(t.id)}
                      className="font-display rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800"
                    >
                      Accepted
                    </button>
                  )}
                  {!isTerminal(t.status) && (
                    <button
                      type="button"
                      onClick={() => handleComplete(t.id)}
                      className="font-display rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800"
                    >
                      Mark done
                    </button>
                  )}
                  {(t.assigned_to === profile.id || !t.assigned_to) && !isTerminal(t.status) && (
                    <button
                      type="button"
                      onClick={() => setDecliningId(t.id)}
                      className="font-display rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      Decline
                    </button>
                  )}
                  {t.created_by === profile.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
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
