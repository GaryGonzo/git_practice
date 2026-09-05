import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { getForumCategories, markForumSeen, type ForumCategory } from "../../lib/golfableApi";

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ForumScreen() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[] | null>(null);

  useEffect(() => {
    getForumCategories().then(setCategories);
  }, []);

  // Opening the forum hub is what clears the badge -- everything new is
  // now one tap away, so there's nothing left to notify about.
  useEffect(() => {
    if (profile) markForumSeen(profile.id);
  }, [profile]);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Forum</h1>
      <p className="font-body text-sm text-neutral-500">Chat with the community, ask questions, share feedback.</p>

      {categories === null ? (
        <p className="font-body mt-6 text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="mt-4 space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/app/forum/${category.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 active:bg-neutral-50"
            >
              <div className="min-w-0">
                <p className="font-label text-base font-semibold">{category.name}</p>
                <p className="font-body mt-1 text-sm text-neutral-600">{category.description}</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 flex-none text-neutral-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
