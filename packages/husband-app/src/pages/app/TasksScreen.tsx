import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import { completeTask, createTask, deleteTask, listTasks, updateTaskStatus } from "../../lib/api";
import type { HouseholdTask, TaskStatus } from "../../types";

type Filter = "for_me" | "from_me" | "all";

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export function TasksScreen() {
  const { profile } = useAuth();
  const { household, members, partner } = useHousehold();
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("for_me");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [assignTo, setAssignTo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!household) return;
    setTasks(await listTasks(household.id));
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

  function memberName(id: string | null) {
    if (!id) return "Anyone";
    if (id === profile?.id) return "You";
    return members.find((m) => m.id === id)?.display_name ?? "Someone";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !household) return;
    if (!title.trim()) {
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
        title: title.trim(),
        description: description.trim() || null,
        points,
      });
      setTitle("");
      setDescription("");
      setPoints(5);
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

  const filtered = tasks.filter((t) => {
    if (filter === "for_me") return t.assigned_to === profile.id;
    if (filter === "from_me") return t.created_by === profile.id;
    return true;
  });

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Tasks</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : "New task"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
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
          <p className="font-body py-8 text-center text-neutral-500">No tasks here.</p>
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

              <div className="mt-3 flex flex-wrap gap-2">
                {t.status === "open" && (t.assigned_to === profile.id || !t.assigned_to) && (
                  <button
                    type="button"
                    onClick={() => handleStart(t.id)}
                    className="font-display rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800"
                  >
                    Start
                  </button>
                )}
                {t.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => handleComplete(t.id)}
                    className="font-display rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800"
                  >
                    Mark done
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
