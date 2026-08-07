import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/app", label: "Home", end: true, emoji: "🏠" },
  { to: "/app/requests", label: "Requests", end: false, emoji: "☕" },
  { to: "/app/tasks", label: "Tasks", end: false, emoji: "✅" },
  { to: "/app/notes", label: "Notes", end: false, emoji: "📝" },
  { to: "/app/profile", label: "Profile", end: false, emoji: "👤" },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
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
