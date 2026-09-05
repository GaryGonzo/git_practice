import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getForumCategoryBySlug,
  getForumThread,
  getForumReplies,
  createForumReply,
  editForumThread,
  editForumReply,
  type ForumCategory,
  type ForumThread,
  type ForumReply,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const TITLE_MAX = 150;
const REPLY_MAX = 5000;

export function ForumThreadScreen() {
  const { categorySlug, threadId } = useParams();
  const { session, profile } = useAuth();

  const [category, setCategory] = useState<ForumCategory | null | undefined>(undefined);
  const [thread, setThread] = useState<ForumThread | null | undefined>(undefined);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingThread, setEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editThreadSubmitting, setEditThreadSubmitting] = useState(false);
  const [editThreadError, setEditThreadError] = useState<string | null>(null);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyBody, setEditReplyBody] = useState("");
  const [editReplySubmitting, setEditReplySubmitting] = useState(false);
  const [editReplyError, setEditReplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug) return;
    getForumCategoryBySlug(categorySlug).then(setCategory);
  }, [categorySlug]);

  async function loadThreadAndReplies() {
    if (!threadId) return;
    const [threadResult, repliesResult] = await Promise.all([getForumThread(threadId), getForumReplies(threadId)]);
    setThread(threadResult);
    setReplies(repliesResult);
  }

  useEffect(() => {
    loadThreadAndReplies();
  }, [threadId]);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !threadId) return;
    setSubmitting(true);
    setError(null);
    try {
      await createForumReply(session.access_token, threadId, replyBody.trim());
      setReplyBody("");
      await loadThreadAndReplies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that reply -- try again.");
    }
    setSubmitting(false);
  }

  function startEditThread() {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditBody(thread.body);
    setEditThreadError(null);
    setEditingThread(true);
  }

  async function handleSaveThread(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !threadId) return;
    setEditThreadSubmitting(true);
    setEditThreadError(null);
    try {
      await editForumThread(session.access_token, threadId, editTitle.trim(), editBody.trim());
      setEditingThread(false);
      await loadThreadAndReplies();
    } catch (err) {
      setEditThreadError(err instanceof Error ? err.message : "Couldn't save that edit -- try again.");
    }
    setEditThreadSubmitting(false);
  }

  function startEditReply(reply: ForumReply) {
    setEditingReplyId(reply.id);
    setEditReplyBody(reply.body);
    setEditReplyError(null);
  }

  async function handleSaveReply(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !editingReplyId) return;
    setEditReplySubmitting(true);
    setEditReplyError(null);
    try {
      await editForumReply(session.access_token, editingReplyId, editReplyBody.trim());
      setEditingReplyId(null);
      await loadThreadAndReplies();
    } catch (err) {
      setEditReplyError(err instanceof Error ? err.message : "Couldn't save that edit -- try again.");
    }
    setEditReplySubmitting(false);
  }

  if (category === undefined || thread === undefined) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (category === null || thread === null) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">That thread doesn't exist, or you don't have access to it.</p>
        <Link
          to={category ? `/app/forum/${category.slug}` : "/app/forum"}
          className="font-label text-brand mt-4 inline-block text-sm font-semibold underline"
        >
          Back to Forum
        </Link>
      </div>
    );
  }

  const isMine = thread.authorId === profile?.id;
  const canEditThread = isMine && thread.status !== "removed";
  const visibleReplies = replies.filter((r) => r.status === "visible" || (r.status === "pending_review" && r.authorId === profile?.id));

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link
        to={`/app/forum/${category.slug}`}
        className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500"
      >
        <BackIcon className="h-4 w-4" />
        Back to {category.name}
      </Link>

      {thread.status === "pending_review" && isMine && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="font-body text-sm text-amber-800">
            Your post is awaiting review -- only you can see it right now. It'll go live once approved.
          </p>
        </div>
      )}
      {thread.status === "removed" && isMine && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="font-body text-sm text-red-700">
            This post was removed by a moderator and isn't visible to other members.
          </p>
        </div>
      )}

      {editingThread ? (
        <form onSubmit={handleSaveThread} className="mt-4 space-y-3">
          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Title</label>
            <input
              type="text"
              required
              maxLength={TITLE_MAX}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Post</label>
            <textarea
              required
              maxLength={REPLY_MAX}
              rows={6}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          {editThreadError && <p className="font-body text-sm text-red-600">{editThreadError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={editThreadSubmitting || !editTitle.trim() || !editBody.trim()}
              className="font-label bg-brand flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {editThreadSubmitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditingThread(false)}
              disabled={editThreadSubmitting}
              className="font-label flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl tracking-wide">{thread.title}</h1>
            {canEditThread && (
              <button
                type="button"
                onClick={startEditThread}
                className="font-label text-brand flex-none text-xs font-semibold underline"
              >
                Edit
              </button>
            )}
          </div>
          <p className="font-body mt-1 text-sm text-neutral-500">
            {thread.authorFirstName} {thread.authorLastName} · {formatDateTime(thread.createdAt)}
            {thread.editedAt && " · edited"}
          </p>
          <p className="font-body mt-4 text-sm whitespace-pre-wrap text-neutral-800">{thread.body}</p>
        </>
      )}

      <h2 className="font-label mt-8 mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
        {visibleReplies.length} {visibleReplies.length === 1 ? "Reply" : "Replies"}
      </h2>

      {visibleReplies.length === 0 && (
        <p className="font-body text-sm text-neutral-500">No replies yet -- be the first.</p>
      )}

      <div className="space-y-3">
        {visibleReplies.map((reply) => {
          const isPendingMine = reply.status === "pending_review" && reply.authorId === profile?.id;
          const canEditReply = reply.authorId === profile?.id && reply.status !== "removed";
          const isEditingThisReply = editingReplyId === reply.id;
          return (
            <div key={reply.id} className="rounded-lg border border-neutral-200 bg-white p-3.5">
              {isEditingThisReply ? (
                <form onSubmit={handleSaveReply} className="space-y-2">
                  <textarea
                    required
                    maxLength={REPLY_MAX}
                    rows={3}
                    value={editReplyBody}
                    onChange={(e) => setEditReplyBody(e.target.value)}
                    className="font-body w-full rounded-md border border-neutral-300 px-3 py-2"
                  />
                  {editReplyError && <p className="font-body text-sm text-red-600">{editReplyError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editReplySubmitting || !editReplyBody.trim()}
                      className="font-label bg-brand flex-1 rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {editReplySubmitting ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReplyId(null)}
                      disabled={editReplySubmitting}
                      className="font-label flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className="font-label text-sm font-semibold">
                      {reply.authorFirstName} {reply.authorLastName}
                    </p>
                    <span className="font-body text-xs text-neutral-400">
                      {formatDateTime(reply.createdAt)}
                      {reply.editedAt && " · edited"}
                    </span>
                    {isPendingMine && (
                      <span className="font-label ml-auto flex-none rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Pending review
                      </span>
                    )}
                  </div>
                  <p className="font-body mt-1.5 text-sm whitespace-pre-wrap text-neutral-700">{reply.body}</p>
                  {canEditReply && (
                    <button
                      type="button"
                      onClick={() => startEditReply(reply)}
                      className="font-label text-brand mt-1.5 text-xs font-semibold underline"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {thread.status === "visible" && (
        <form onSubmit={handleReply} className="mt-6">
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Add a reply
          </label>
          <textarea
            required
            maxLength={REPLY_MAX}
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
          {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !replyBody.trim()}
            className="font-label bg-brand mt-2 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Reply"}
          </button>
        </form>
      )}
    </div>
  );
}
