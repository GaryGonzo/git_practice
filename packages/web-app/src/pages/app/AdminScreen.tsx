import { useEffect, useState } from "react";
import { TIER_INFO } from "@golfable/shared";
import {
  getAdminUserOverview,
  getStudiosOverview,
  createStudio,
  type AdminUserOverview,
  type StudioOverview,
} from "../../lib/golfableApi";

const INDIVIDUAL_TIER_PRICE: Record<string, string> = {
  free: "Free forever",
  tier_799: "$7.99/mo",
  tier_1499: "$14.99/mo",
  tier_1999: "$19.99/mo",
};

function membershipLabel(u: AdminUserOverview): string {
  if (u.studioName) return `Studio: ${u.studioName}`;
  if (!u.individualTier) return "Not yet assigned";
  const price = INDIVIDUAL_TIER_PRICE[u.individualTier] ?? u.individualTier;
  if (u.individualTier === "free") return price;
  return `${price} — ${u.subscriptionStatus === "active" ? "active" : "not subscribed"}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StudiosSection({ users }: { users: AdminUserOverview[] }) {
  const [studios, setStudios] = useState<StudioOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function refresh() {
    setStudios(await getStudiosOverview());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !ownerId) {
      setError("A studio name and owner are both required.");
      return;
    }
    setCreating(true);
    try {
      await createStudio(name.trim(), ownerId);
      setName("");
      setOwnerId("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that studio -- try again.");
    }
    setCreating(false);
  }

  async function handleCopy(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/my-studio/${slug}`);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 1500);
    } catch {
      // Clipboard access can fail silently -- the link is already visible either way.
    }
  }

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl tracking-wide">Studios</h2>
      <p className="font-body mt-1 text-sm text-neutral-500">
        Private studio accounts, like an indoor golf simulator's own leaderboard inside Golfable.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="font-label block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Studio name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="214 Golf"
            className="font-body mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="font-label block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Owner</label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="font-body mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Select a member…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="font-label bg-brand rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create Studio"}
        </button>
      </form>
      {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="font-label border-b border-neutral-200 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              <th className="px-4 py-3">Studio</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Join Link</th>
            </tr>
          </thead>
          <tbody className="font-body divide-y divide-neutral-100">
            {studios.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-neutral-900">{s.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                  {s.ownerFirstName} {s.ownerLastName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{s.memberCount}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleCopy(s.slug)}
                    className="font-label inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600"
                  >
                    <CopyIcon className="h-4 w-4 text-neutral-400" />
                    {copiedSlug === s.slug ? "Copied!" : `/my-studio/${s.slug}`}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && studios.length === 0 && (
          <p className="font-body p-6 text-center text-sm text-neutral-500">No studios yet.</p>
        )}
      </div>
    </div>
  );
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
        // Supabase RPC errors are plain objects, not Error instances --
        // pull the real message off them instead of always showing a
        // generic fallback that hides what actually went wrong.
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Couldn't load member data.";
        setError(message);
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
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="font-label border-b border-neutral-200 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Membership</th>
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
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{membershipLabel(u)}</td>
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

          <StudiosSection users={users} />
        </>
      )}
    </div>
  );
}
