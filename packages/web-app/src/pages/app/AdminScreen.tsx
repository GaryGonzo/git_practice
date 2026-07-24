import { useEffect, useState } from "react";
import { TIER_INFO } from "@golfable/shared";
import { getAdminUserOverview, type AdminUserOverview } from "../../lib/golfableApi";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AdminScreen() {
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setUsers(await getAdminUserOverview());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load member data.");
      }
      setLoading(false);
    })();
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query)
      )
    : users;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Admin Dashboard</h1>
      <p className="font-body mt-1 text-sm text-neutral-500">
        {loading ? "Loading…" : `${users.length} member${users.length === 1 ? "" : "s"} total`}
      </p>

      {error && <p className="font-body mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="font-body mt-4 w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />

          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="font-label border-b border-neutral-200 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Signed Up</th>
                  <th className="px-4 py-3">This Week</th>
                  <th className="px-4 py-3">Total Scores</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Marketing</th>
                </tr>
              </thead>
              <tbody className="font-body divide-y divide-neutral-100">
                {filtered.map((u) => (
                  <tr key={u.id} className={u.totalScores === 0 ? "bg-neutral-50/60" : undefined}>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap text-neutral-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{u.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{TIER_INFO[u.tier].label}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                      {u.sessionsThisWeek}/{u.weeklyGoal}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{u.totalScores}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                      {u.lastActive ? (
                        formatDateTime(u.lastActive)
                      ) : (
                        <span className="text-neutral-400 italic">Never played</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                      {u.marketingOptIn ? "Yes" : "No"}
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
