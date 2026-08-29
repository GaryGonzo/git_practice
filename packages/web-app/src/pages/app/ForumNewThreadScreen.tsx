import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { getForumCategoryBySlug, createForumThread, type ForumCategory } from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TITLE_MAX = 150;
const BODY_MAX = 5000;

export function ForumNewThreadScreen() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [category, setCategory] = useState<ForumCategory | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug) return;
    getForumCategoryBySlug(categorySlug).then(setCategory);
  }, [categorySlug]);

  if (category === undefined) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (category === null) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">That forum category doesn't exist.</p>
        <Link to="/app/forum" className="font-label text-brand mt-4 inline-block text-sm font-semibold underline">
          Back to Forum
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createForumThread(session.access_token, category!.id, title.trim(), body.trim());
      navigate(`/app/forum/${category!.slug}/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that -- try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link
        to={`/app/forum/${category.slug}`}
        className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500"
      >
        <BackIcon className="h-4 w-4" />
        Back to {category.name}
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">New Thread</h1>
      <p className="font-body text-sm text-neutral-500">
        Posted to {category.name}. New threads are checked before they go live -- most post right away.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Title</label>
          <input
            type="text"
            required
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Post</label>
          <textarea
            required
            maxLength={BODY_MAX}
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Say more..."
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !title.trim() || !body.trim()}
          className="font-label bg-brand w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post Thread"}
        </button>
      </form>
    </div>
  );
}
