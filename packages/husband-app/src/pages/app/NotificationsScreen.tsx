import { useEffect } from "react";
import { useNotifications } from "../../lib/NotificationsProvider";
import { Avatar } from "../../components/Avatar";

const KIND_EMOJI: Record<string, string> = {
  request_created: "☕",
  request_done: "✅",
  task_created: "📋",
  task_done: "🏆",
  bonus_points: "🎁",
};

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsScreen() {
  const { notifications, loading, markAllRead } = useNotifications();

  useEffect(() => {
    markAllRead();
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-3xl">Notifications</h1>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="font-body text-center text-neutral-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="font-body py-8 text-center text-neutral-500">Nothing yet.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3">
              {n.actor ? <Avatar profile={n.actor} size={36} /> : <span className="text-2xl">{KIND_EMOJI[n.kind]}</span>}
              <div className="flex-1">
                <p className="font-display text-sm font-semibold">
                  {KIND_EMOJI[n.kind]} {n.title}
                </p>
                {n.body && <p className="font-body text-sm text-neutral-600">{n.body}</p>}
                <p className="font-body mt-0.5 text-xs text-neutral-400">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
