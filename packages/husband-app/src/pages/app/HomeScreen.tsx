import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { useHousehold } from "../../lib/HouseholdProvider";
import { listPointsLedger, listRequests, listTasks, pointsSummaryForMember, totalsByMember } from "../../lib/api";
import { PointsSummary } from "../../components/PointsSummary";
import { Avatar } from "../../components/Avatar";
import { WelcomeTour } from "../../components/WelcomeTour";
import { getRoleCopy } from "../../lib/roleCopy";
import type { HouseholdRequest, HouseholdTask, PointsLedgerEntry } from "../../types";

function welcomeKey(profileId: string): string {
  return `husband-app:welcomed:${profileId}`;
}

export function HomeScreen() {
  const { profile } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [requests, setRequests] = useState<HouseholdRequest[]>([]);
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [showTour, setShowTour] = useState(false);

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

  useEffect(() => {
    if (!profile) return;
    if (!localStorage.getItem(welcomeKey(profile.id))) {
      setShowTour(true);
    }
  }, [profile]);

  function dismissTour() {
    if (profile) localStorage.setItem(welcomeKey(profile.id), "1");
    setShowTour(false);
  }

  if (!profile || !household) return null;

  const copy = getRoleCopy(profile.role);
  const totals = totalsByMember(ledger);
  const husband = members.find((m) => m.role === "husband");
  const husbandAvailable = husband ? pointsSummaryForMember(ledger, husband.id).available : 0;

  const myOpenRequests = requests.filter((r) => r.assigned_to === profile.id && (r.status === "pending" || r.status === "in_progress"));
  const myOpenTasks = tasks.filter((t) => t.assigned_to === profile.id && t.status !== "done" && t.status !== "declined");
  const myUrgentCount = [...myOpenRequests, ...myOpenTasks].filter(
    (item) => item.urgency === "emergency" || item.urgency === "urgent"
  ).length;

  const board = {
    pending: requests.filter((r) => r.status === "pending").length + tasks.filter((t) => t.status === "open").length,
    inProgress:
      requests.filter((r) => r.status === "in_progress").length + tasks.filter((t) => t.status === "in_progress").length,
    done: requests.filter((r) => r.status === "done").length + tasks.filter((t) => t.status === "done").length,
    declined: requests.filter((r) => r.status === "declined").length + tasks.filter((t) => t.status === "declined").length,
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      {showTour && <WelcomeTour onDone={dismissTour} memberId={profile.id} />}
      <p className="font-display text-sm font-semibold tracking-widest text-neutral-500 uppercase">Welcome back</p>
      <h1 className="font-display flex items-center gap-2 text-3xl">
        <Avatar profile={profile} size={36} />
        {profile.display_name}
      </h1>
      <p className="font-body mt-1 text-sm text-neutral-500">{household.name}</p>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center font-body text-neutral-500">
          Loading…
        </div>
      ) : (
        <>
          {myUrgentCount > 0 && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="font-display text-sm font-semibold text-red-700">
                🚨 {myUrgentCount} thing{myUrgentCount === 1 ? "" : "s"} marked urgent or CODE RED. Move.
              </p>
            </div>
          )}

          <Link
            to="/app/requests"
            className="mt-6 block rounded-2xl border border-neutral-200 bg-white p-4 active:scale-[0.99]"
          >
            <p className="font-display text-sm font-semibold">{copy.homeRequestsCard}</p>
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
            <p className="font-display text-sm font-semibold">{copy.homeTasksCard}</p>
            <p className="font-body mt-0.5 text-sm text-neutral-500">
              {myOpenTasks.length === 0
                ? "All caught up."
                : `${myOpenTasks.length} task${myOpenTasks.length === 1 ? "" : "s"} open`}
            </p>
          </Link>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Board</p>
            <p className="font-body mt-0.5 text-xs text-neutral-500">
              How things are going between the two of you.
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="font-display text-xl font-semibold text-amber-600">{board.pending}</p>
                <p className="font-body text-xs text-neutral-500">Pending</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-blue-600">{board.inProgress}</p>
                <p className="font-body text-xs text-neutral-500">In progress</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-green-600">{board.done}</p>
                <p className="font-body text-xs text-neutral-500">Done</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-red-600">{board.declined}</p>
                <p className="font-body text-xs text-neutral-500">Declined</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-display text-xs font-semibold tracking-widest text-neutral-500 uppercase">Points</p>
            <div className="mt-3">
              <PointsSummary members={members} totals={totals} meId={profile.id} />
            </div>
            {husband && (
              <Link
                to="/app/rewards"
                className="font-body mt-3 block rounded-lg bg-brand-light px-3 py-2 text-xs text-brand-dark"
              >
                {husband.id === profile.id
                  ? `🎁 You have ${husbandAvailable} points -- cash in your rewards`
                  : `🎁 ${husband.display_name} has ${husbandAvailable} points -- see what he can redeem`}
              </Link>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link to="/app/notes" className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
              <p className="font-display text-sm font-semibold">📝 Notes</p>
            </Link>
            <Link to="/app/rewards" className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
              <p className="font-display text-sm font-semibold">🎁 Rewards</p>
            </Link>
            <Link to="/app/profile" className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
              <p className="font-display text-sm font-semibold">👤 Household</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
