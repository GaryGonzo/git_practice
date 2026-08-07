import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import { listPointsLedger, listRequests, listTasks, totalsByMember } from "../../lib/api";
import { PointsSummary } from "../../components/PointsSummary";
import type { HouseholdRequest, HouseholdTask, PointsLedgerEntry } from "../../types";

export function HomeScreen() {
  const { profile } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [requests, setRequests] = useState<HouseholdRequest[]>([]);
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);

  useEffect(() => {
    if (!household) return;
    (async () => {
      setLoading(true);
      const [l, r, t] = await Promise.all([
        listPointsLedger(household.id),
        listRequests(household.id),
        listTasks(household.id),
      ]);
      setLedger(l);
      setRequests(r);
      setTasks(t);
      setLoading(false);
    })();
  }, [household]);

  if (!profile || !household) return null;

  const totals = totalsByMember(ledger);
  const myOpenRequests = requests.filter((r) => r.assigned_to === profile.id && (r.status === "pending" || r.status === "in_progress"));
  const myOpenTasks = tasks.filter((t) => t.assigned_to === profile.id && t.status !== "done");

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <p className="font-display text-sm font-semibold tracking-widest text-neutral-500 uppercase">Welcome back</p>
      <h1 className="font-display text-3xl">
        {profile.avatar_emoji} {profile.display_name}
      </h1>
      <p className="font-body mt-1 text-sm text-neutral-500">{household.name}</p>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center font-body text-neutral-500">
          Loading…
        </div>
      ) : (
        <>
          <Link
            to="/app/requests"
            className="mt-6 block rounded-2xl border border-neutral-200 bg-white p-4 active:scale-[0.99]"
          >
            <p className="font-display text-sm font-semibold">☕ Waiting on you</p>
            <p className="font-body mt-0.5 text-sm text-neutral-500">
              {myOpenRequests.length === 0
                ? "No open requests -- nice."
                : `${myOpenRequests.length} request${myOpenRequests.length === 1 ? "" : "s"} to take care of`}
            </p>
          </Link>

          <Link
            to="/app/tasks"
            className="mt-3 block rounded-2xl border border-neutral-200 bg-white p-4 active:scale-[0.99]"
          >
            <p className="font-display text-sm font-semibold">✅ On your honey-do list</p>
            <p className="font-body mt-0.5 text-sm text-neutral-500">
              {myOpenTasks.length === 0
                ? "All caught up."
                : `${myOpenTasks.length} task${myOpenTasks.length === 1 ? "" : "s"} open`}
            </p>
          </Link>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Points</p>
            <div className="mt-3">
              <PointsSummary members={members} totals={totals} meId={profile.id} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link to="/app/notes" className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="font-display text-sm font-semibold">📝 Notes</p>
              <p className="font-body text-xs text-neutral-500">Her coffee order, on hand</p>
            </Link>
            <Link to="/app/profile" className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="font-display text-sm font-semibold">👤 Household</p>
              <p className="font-body text-xs text-neutral-500">Invite code &amp; history</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
