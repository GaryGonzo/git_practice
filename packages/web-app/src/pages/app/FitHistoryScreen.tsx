import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import { getFitWorkoutHistory, type FitWorkoutHistoryEntry } from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function HistoryRow({ entry }: { entry: FitWorkoutHistoryEntry }) {
  const allDone = entry.exercisesTotal > 0 && entry.exercisesCompleted === entry.exercisesTotal;
  return (
    <Link
      to={`/app/fit/workout/${entry.id}`}
      className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 active:bg-neutral-50"
    >
      <div className="min-w-0 flex-1">
        <p className="font-label text-sm font-semibold">{entry.templateName}</p>
        <p className="font-body text-sm text-neutral-500">
          {entry.blockName} &middot; {entry.completedAt ? formatDate(entry.completedAt) : "Unknown date"}
        </p>
      </div>
      <span
        className={`font-label flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${
          allDone ? "bg-brand/10 text-brand" : "bg-neutral-100 text-neutral-500"
        }`}
      >
        {entry.exercisesCompleted}/{entry.exercisesTotal}
      </span>
      <ChevronRightIcon className="h-4 w-4 flex-none text-neutral-400" />
    </Link>
  );
}

export function FitHistoryScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<FitWorkoutHistoryEntry[]>([]);

  useEffect(() => {
    getFitWorkoutHistory(userId).then((h) => {
      setHistory(h);
      setLoading(false);
    });
  }, [userId]);

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-24">
      <Link to="/app/fit" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Golfable Fit
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Workout History</h1>
      <p className="font-body mt-1 text-sm text-neutral-500">
        {loading ? "Loading…" : `${history.length} workout${history.length === 1 ? "" : "s"} completed`}
      </p>

      <div className="mt-4 space-y-2">
        {!loading && history.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-center">
            <p className="font-body text-sm text-neutral-500">No completed workouts yet.</p>
          </div>
        )}
        {history.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
