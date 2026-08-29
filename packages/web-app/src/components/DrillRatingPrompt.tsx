import { useState } from "react";
import { rateDrill } from "../lib/golfableApi";

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className} aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Shown once, right after a player's first-ever completion of a drill.
// Feeds both "My Favorites" and "Community Favorites" in Choose Your Own.
export function DrillRatingPrompt({ userId, drillId }: { userId: string; drillId: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleRate(value: number) {
    if (saving || rating !== null) return;
    setSaving(true);
    setRating(value);
    try {
      await rateDrill(userId, drillId, value);
    } catch {
      setRating(null);
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 text-center">
      {rating !== null ? (
        <p className="font-label text-sm font-semibold text-neutral-700">Thanks for rating it!</p>
      ) : (
        <>
          <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            First time playing this one
          </p>
          <p className="font-body mt-1 text-sm text-neutral-600">How'd you like it?</p>
          <div className="mt-2 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleRate(n)}
                disabled={saving}
                aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                className="text-gold p-0.5"
              >
                <StarIcon filled={(hovered ?? 0) >= n} className="h-7 w-7" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
