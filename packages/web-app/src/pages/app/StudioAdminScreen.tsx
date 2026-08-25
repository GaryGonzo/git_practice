import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TIER_INFO } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { getStudioByOwnerId, getStudioRoster, type Studio, type StudioRosterEntry } from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function StudioAdminScreen() {
  const { profile } = useAuth();
  const [studio, setStudio] = useState<Studio | null | undefined>(undefined);
  const [roster, setRoster] = useState<StudioRosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const found = await getStudioByOwnerId(profile.id);
      setStudio(found);
      if (found) {
        try {
          setRoster(await getStudioRoster(found.id));
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
                ? String((err as { message: unknown }).message)
                : "Couldn't load your studio's roster.";
          setError(message);
        }
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  if (!studio) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">You don't manage a studio.</p>
        <Link to="/app/profile" className="font-label text-brand mt-4 inline-block text-sm font-semibold underline">
          Back to Profile
        </Link>
      </div>
    );
  }

  const joinLink = `${window.location.origin}/my-studio/${studio.slug}`;
  const query = search.trim().toLowerCase();
  const filtered = query
    ? roster.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(query))
    : roster;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-24">
      <Link to="/app/profile" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back to Profile
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Manage {studio.name}</h1>
      <p className="font-body mt-1 text-sm text-neutral-500">
        {roster.length} member{roster.length === 1 ? "" : "s"} total
      </p>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Join link</p>
        <p className="font-body mt-1 truncate text-sm text-neutral-700">{joinLink}</p>
      </div>

      {error && <p className="font-body mt-4 text-sm text-red-600">{error}</p>}

      {!error && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="font-body mt-4 w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />

          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="font-label border-b border-neutral-200 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">This Week</th>
                  <th className="px-4 py-3">Total Scores</th>
                  <th className="px-4 py-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="font-body divide-y divide-neutral-100">
                {filtered.map((m) => (
                  <tr key={m.id} className={m.totalScores === 0 ? "bg-neutral-50/60" : undefined}>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap text-neutral-900">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{TIER_INFO[m.tier].label}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                      {m.sessionsThisWeek}/{m.weeklyGoal}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{m.totalScores}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                      {m.lastActive ? (
                        formatDateTime(m.lastActive)
                      ) : (
                        <span className="text-neutral-400 italic">Never played</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="font-body p-6 text-center text-sm text-neutral-500">No members match that search.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
