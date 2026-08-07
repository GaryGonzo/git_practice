import { Link, NavLink, Outlet } from "react-router-dom";
import { useHousehold } from "../lib/HouseholdProvider";
import { useNotifications } from "../lib/NotificationsProvider";

const NAV_ITEMS = [
  { to: "/app", label: "Home", end: true, emoji: "🏠" },
  { to: "/app/requests", label: "Requests", end: false, emoji: "☕" },
  { to: "/app/tasks", label: "Tasks", end: false, emoji: "✅" },
  { to: "/app/notes", label: "Notes", end: false, emoji: "📝" },
  { to: "/app/profile", label: "Profile", end: false, emoji: "👤" },
];

export function AppShell() {
  const { household } = useHousehold();
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <p className="font-display text-sm font-semibold text-neutral-600">{household?.name}</p>
        <Link to="/app/notifications" className="relative rounded-full p-1.5 text-xl" aria-label="Notifications">
          🔔
          {unreadCount > 0 && (
            <span className="font-display absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-md">
          {NAV_ITEMS.map(({ to, label, end, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `font-display flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${
                  isActive ? "text-brand" : "text-neutral-400"
                }`
              }
            >
              <span className="text-lg leading-none">{emoji}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
