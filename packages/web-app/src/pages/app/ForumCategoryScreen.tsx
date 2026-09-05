import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getForumCategoryBySlug,
  getForumThreads,
  markForumCategorySeen,
  type ForumCategory,
  type ForumThreadSummary,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 2a1 1 0 0 1 1 1v3.2l2.7 2.3a1 1 0 0 1 .3.7V10a1 1 0 0 1-1 1h-2.3l-.4 6-1 1-1-1-.4-6H5.3a1 1 0 0 1-1-1v-.8a1 1 0 0 1 .3-.7L7 6.2V3a1 1 0 0 1 1-1h2Z" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ForumCategoryScreen() {
  const { categorySlug } = useParams();
  const { profile } = useAuth();
  const [category, setCategory] = useState<ForumCategory | null | undefined>(undefined);
  const [threads, setThreads] = useState<ForumThreadSummary[] | null>(null);

  useEffect(() => {
    if (!categorySlug) return;
    getForumCategoryBySlug(categorySlug).then(setCategory);
  }, [categorySlug]);

  useEffect(() => {
    if (!category) return;
    getForumThreads(category.id).then(setThreads);
  }, [category]);

  // Opening this category is what clears its badge -- its threads are
  // right here now, so there's nothing left to notify about for it.
  useEffect(() => {
    if (category && profile) markForumCategorySeen(profile.id, category.id);
  }, [category, profile]);

  if (category === undefined || (category && threads === null)) {
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

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/forum" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back to Forum
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">{category.name}</h1>
        <Link
          to={`/app/forum/${category.slug}/new`}
          className="font-label bg-brand flex-none rounded-md px-4 py-2 text-sm font-semibold text-white"
        >
          New Thread
        </Link>
      </div>
      <p className="font-body text-sm text-neutral-500">{category.description}</p>

      {threads && threads.length === 0 && (
        <p className="font-body mt-8 text-center text-sm text-neutral-500">
          No threads yet -- be the first to post.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {threads?.map((thread) => {
          const isPendingMine = thread.status === "pending_review" && thread.authorId === profile?.id;
          return (
            <Link
              key={thread.id}
              to={`/app/forum/${category.slug}/${thread.id}`}
              className="block rounded-lg border border-neutral-200 bg-white p-4 active:bg-neutral-50"
            >
              <div className="flex items-start gap-2">
                {thread.pinned && <PinIcon className="text-gold mt-0.5 h-4 w-4 flex-none" />}
                <p className="font-label min-w-0 flex-1 text-base font-semibold">{thread.title}</p>
                {isPendingMine && (
                  <span className="font-label flex-none rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    Pending review
                  </span>
                )}
              </div>
              <p className="font-body mt-1 text-sm text-neutral-500">
                {thread.authorFirstName} {thread.authorLastName} · {formatDate(thread.createdAt)} ·{" "}
                {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
