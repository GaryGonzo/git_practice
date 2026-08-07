import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import { deletePreference, listPreferences, upsertPreference } from "../../lib/api";
import { Avatar } from "../../components/Avatar";
import type { Preference, PreferenceCategory } from "../../types";

const CATEGORY_LABEL: Record<PreferenceCategory, string> = {
  coffee: "☕ Coffee order",
  starbucks: "🥤 Starbucks order",
  general: "💭 General",
};

const CATEGORIES: PreferenceCategory[] = ["coffee", "starbucks", "general"];

export function NotesScreen() {
  const { profile } = useAuth();
  const { household, members } = useHousehold();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Preference | null>(null);

  const [category, setCategory] = useState<PreferenceCategory>("coffee");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!household) return;
    setPreferences(await listPreferences(household.id));
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [household]);

  if (!profile || !household) return null;

  function startCreate() {
    setEditing(null);
    setCategory("coffee");
    setTitle("");
    setBody("");
    setError(null);
    setShowForm(true);
  }

  function startEdit(pref: Preference) {
    setEditing(pref);
    setCategory(pref.category);
    setTitle(pref.title);
    setBody(pref.body);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!household || !profile) return;
    if (!title.trim() || !body.trim()) {
      setError("Fill in both a title and the note itself.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await upsertPreference({
        id: editing?.id,
        householdId: household.id,
        memberId: profile.id,
        category,
        title: title.trim(),
        body: body.trim(),
      });
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that note.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deletePreference(id);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Notes</h1>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="font-display bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : "New note"}
        </button>
      </div>
      <p className="font-body mt-1 text-sm text-neutral-500">
        Standing preferences so a surprise doesn't require a question first.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Category
            </label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`font-display rounded-md border px-2 py-2 text-xs font-semibold ${
                    category === c ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Title
            </label>
            <input
              type="text"
              placeholder="Usual order"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Note
            </label>
            <textarea
              placeholder="Grande iced oat milk latte, extra shot"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : editing ? "Save changes" : "Save note"}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-6">
        {loading ? (
          <p className="font-body text-center text-neutral-500">Loading…</p>
        ) : (
          members.map((member) => {
            const own = preferences.filter((p) => p.member_id === member.id);
            if (own.length === 0) return null;
            return (
              <div key={member.id}>
                <p className="font-display flex items-center gap-1.5 text-sm font-semibold text-neutral-500">
                  <Avatar profile={member} size={18} />
                  {member.id === profile.id ? "Your notes" : `${member.display_name}'s notes`}
                </p>
                <div className="mt-2 space-y-2">
                  {own.map((pref) => (
                    <div key={pref.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                      <p className="font-display text-xs font-semibold text-brand">{CATEGORY_LABEL[pref.category]}</p>
                      <p className="font-display mt-0.5 text-sm font-semibold">{pref.title}</p>
                      <p className="font-body mt-0.5 text-sm text-neutral-600">{pref.body}</p>
                      {pref.member_id === profile.id && (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(pref)}
                            className="font-display rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pref.id)}
                            className="font-display rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        {!loading && preferences.length === 0 && (
          <p className="font-body py-8 text-center text-neutral-500">No notes yet -- add your usual order.</p>
        )}
      </div>
    </div>
  );
}
