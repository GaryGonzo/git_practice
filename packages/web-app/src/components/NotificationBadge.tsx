// A small unread-count pill, iOS-app-badge style. Caps its display at
// "100+" rather than growing without bound, and renders nothing for a
// count of 0 -- a badge should only ever appear when there's something new.
export function NotificationBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`font-label bg-gold flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${className}`}
    >
      {count > 100 ? "100+" : count}
    </span>
  );
}
