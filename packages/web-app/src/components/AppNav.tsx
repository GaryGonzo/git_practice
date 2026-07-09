import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";
import { updateProfile } from "../lib/golfableApi";
import { JUST_LOGGED_IN_KEY } from "../lib/sessionFlags";
import { WelcomeWalkthrough } from "./WelcomeWalkthrough";
import { WelcomeBackModal } from "./WelcomeBackModal";

const NAV_ITEMS = [
  { to: "/app", label: "Today", end: true, icon: TodayIcon },
  { to: "/app/progress", label: "Progress", end: false, icon: ProgressIcon },
  { to: "/app/library", label: "Library", end: false, icon: LibraryIcon },
  { to: "/app/profile", label: "Profile", end: false, icon: ProfileIcon },
];

export function TodayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 17l5-5 4 3 7-8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="5" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="11" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="17" width="10" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19c1.2-3.5 4-5 7-5s5.8 1.5 7 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AppShell() {
  const { profile, refreshProfile } = useAuth();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(JUST_LOGGED_IN_KEY)) {
      sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
      setShowWelcomeBack(true);
    }
  }, []);

  async function dismissWalkthrough() {
    if (!profile) return;
    await updateProfile(profile.id, { has_seen_walkthrough: true });
    await refreshProfile();
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      {profile && !profile.has_seen_walkthrough ? (
        <WelcomeWalkthrough onDone={dismissWalkthrough} />
      ) : (
        profile &&
        showWelcomeBack && (
          <WelcomeBackModal firstName={profile.first_name} onDismiss={() => setShowWelcomeBack(false)} />
        )
      )}
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-md">
          {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `font-label flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${
                  isActive ? "text-brand" : "text-neutral-400"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
