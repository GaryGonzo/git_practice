import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";
import { updateProfile } from "../lib/golfableApi";
import { JUST_LOGGED_IN_KEY } from "../lib/sessionFlags";
import { WelcomeWalkthrough } from "./WelcomeWalkthrough";
import { WelcomeBackModal } from "./WelcomeBackModal";

type NavItem = { to: string; label: string; end: boolean; icon: (props: { className?: string }) => React.ReactElement };

// Golfable and Golfable Fit each get their own bottom bar, so the tabs
// always match the section you're in. Anyone with Fit also gets a tab that
// jumps straight to the other section's home.
function golfNav(hasFit: boolean): NavItem[] {
  const items: NavItem[] = [
    { to: hasFit ? "/app/golf" : "/app", label: "Home", end: true, icon: HomeIcon },
    { to: "/app/library", label: "Library", end: false, icon: LibraryIcon },
    { to: "/app/round", label: "Round", end: false, icon: RoundIcon },
    { to: "/app/leaderboard", label: "Leaders", end: false, icon: LeaderboardIcon },
    { to: "/app/profile", label: "Profile", end: false, icon: ProfileIcon },
  ];
  if (hasFit) items.push({ to: "/app/fit/today", label: "Fit", end: false, icon: SwitchIcon });
  return items;
}

const FIT_NAV: NavItem[] = [
  { to: "/app/fit/today", label: "Today", end: true, icon: TodayIcon },
  { to: "/app/fit", label: "Program", end: true, icon: DumbbellIcon },
  { to: "/app/fit/checkin", label: "Check-in", end: true, icon: ProgressIcon },
  { to: "/app/fit/plan", label: "Walks", end: true, icon: WalkIcon },
  { to: "/app/golf", label: "Golfable", end: false, icon: SwitchIcon },
];

export function SwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 8h12m-3.5-3.5L17 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 16H7m3.5-3.5L7 16l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12h2M19 12h2M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="5" y="8.5" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="16" y="8.5" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function WalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="13.5" cy="4.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 8.5l2 3-1 3 3 5M13 11.5l3-1 2 2M10.5 14.5l-2 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 11.5L12 5l8 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v8a1 1 0 001 1h10a1 1 0 001-1v-8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

export function RoundIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 20V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 4l9 3.5L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="7" cy="20.5" rx="4" ry="1.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function LeaderboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10v3.5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 5h3v1.5A3.5 3.5 0 0 1 17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 12.5V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 20h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.5 16.5h5l.8 3.5h-6.6l.8-3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function ForumIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
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
  const { pathname } = useLocation();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const hasFit = profile?.fit_access ?? false;
  const onLauncher = hasFit && (pathname === "/app" || pathname === "/app/");
  const navItems = pathname.startsWith("/app/fit") ? FIT_NAV : golfNav(hasFit);

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
    <div className={`min-h-screen ${onLauncher ? "bg-brand-dark" : "bg-neutral-50 pb-16"}`}>
      {profile && !profile.has_seen_walkthrough ? (
        <WelcomeWalkthrough profile={profile} onDone={dismissWalkthrough} />
      ) : (
        profile &&
        showWelcomeBack && (
          <WelcomeBackModal firstName={profile.first_name} onDismiss={() => setShowWelcomeBack(false)} />
        )
      )}
      <Outlet />
      {!onLauncher && (
      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {navItems.map(({ to, label, end, icon: Icon }) => (
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
      )}
    </div>
  );
}
