import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CATEGORY_INFO, type Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { LeaderboardBoard } from "../../components/LeaderboardBoard";
import { getDrillForDate, getStudioById, type Studio } from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function LeaderboardScreen() {
  const { drillId, date } = useParams();
  const { profile } = useAuth();

  const [drill, setDrill] = useState<Drill | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);

  // A studio member's full leaderboard is their studio's, same scoping as
  // the Home screen's live widget -- everyone else sees the public one.
  useEffect(() => {
    if (!profile?.studio_id) {
      setStudio(null);
      return;
    }
    getStudioById(profile.studio_id).then(setStudio);
  }, [profile?.studio_id]);

  useEffect(() => {
    if (!date) return;
    getDrillForDate(date).then((found) => setDrill(found?.drill ?? null));
  }, [date]);

  if (!drillId || !date) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/leaderboard" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">{studio ? studio.name : "Golfable"} Leaderboard</h1>
      <p className="font-body text-sm text-neutral-500">
        {drill ? `${drill.name} · ${CATEGORY_INFO[drill.category].label}` : " "} &middot; {formatDate(date)}
      </p>

      <div className="mt-4">
        <LeaderboardBoard drill={drill} date={date} studio={studio} />
      </div>
    </div>
  );
}
