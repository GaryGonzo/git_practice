import { useEffect, useState } from "react";
import { listAllUsers } from "../../lib/api";
import type { AdminUserRow } from "../../types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AdminScreen() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load users."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-3xl">Admin</h1>
      <p className="font-body mt-1 text-sm text-neutral-500">Signup count and basic account info -- visible only to you.</p>

      {loading ? (
        <p className="font-body mt-6 text-center text-neutral-500">Loading…</p>
      ) : error ? (
        <p className="font-body mt-6 text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 text-center">
            <p className="font-display text-4xl font-semibold text-brand">{users.length}</p>
            <p className="font-body mt-1 text-sm text-neutral-500">total signups</p>
          </div>

          <div className="mt-4 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                <p className="font-display text-sm font-semibold">{u.display_name}</p>
                <p className="font-body text-sm text-neutral-600">{u.email}</p>
                <p className="font-body mt-0.5 text-xs text-neutral-400">
                  {u.role} · joined {formatDate(u.created_at)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
