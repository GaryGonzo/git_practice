import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, RANK_CARD_CUTOFF, formatScore, type Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { LeaderboardBoard } from "../../components/LeaderboardBoard";
import {
  getDrillForDate,
  getPastGolfables,
  getStudioById,
  getRankBoard,
  todayISO,
  type PastGolfableEntry,
  type Studio,
} from "../../lib/golfableApi";

type Tab = "today" | "week" | "mine";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Past 7 Days" },
  { id: "mine", label: "My Week" },
];

function formatWeekday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

interface MyWeekRow {
  entry: PastGolfableEntry;
  rank: number;
}

export function LeaderboardHubScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("today");
  const [studio, setStudio] = useState<Studio | null>(null);
  const [todayDrill, setTodayDrill] = useState<Drill | null | undefined>(undefined);
  const [pastDays, setPastDays] = useState<PastGolfableEntry[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [myWeek, setMyWeek] = useState<MyWeekRow[] | null>(null);

  // A studio member's board is their studio's, same scoping used everywhere
  // else a leaderboard shows up -- everyone else sees the public one.
  useEffect(() => {
    if (!profile?.studio_id) {
      setStudio(null);
      return;
    }
    getStudioById(profile.studio_id).then(setStudio);
  }, [profile?.studio_id]);

  useEffect(() => {
    getDrillForDate(todayISO()).then((found) => setTodayDrill(found?.drill ?? null));
  }, []);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoadingPast(true);
      const past = await getPastGolfables(profile.id);
      const last7 = past.slice(0, 7);
      setPastDays(last7);
      setSelectedDate((prev) => prev ?? last7[0]?.date ?? null);
      setLoadingPast(false);
    })();
  }, [profile]);

  useEffect(() => {
    if (!profile || tab !== "mine" || myWeek || pastDays.length === 0) return;
    (async () => {
      const rows = await Promise.all(
        pastDays.map(async (entry): Promise<MyWeekRow> => {
          const board = await getRankBoard(
            profile.studio_id,
            entry.drill.id,
            profile.tier,
            entry.date,
            entry.drill.scoreDirection
          );
          const rawRank = board.findIndex((e) => e.userId === profile.id) + 1;
          const rank = rawRank > 0 && rawRank <= RANK_CARD_CUTOFF ? rawRank : 0;
          return { entry, rank };
        })
      );
      setMyWeek(rows);
    })();
  }, [profile, tab, pastDays, myWeek]);

  if (!profile) return null;

  const selectedPastEntry = pastDays.find((d) => d.date === selectedDate) ?? null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">{studio ? studio.name : "Golfable"} Leaderboard</h1>

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`font-label rounded-md border px-2 py-2 text-sm font-semibold ${
              tab === id ? "bg-brand border-transparent text-white" : "border-neutral-300 text-neutral-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="mt-4">
          {todayDrill === undefined ? (
            <p className="font-body text-center text-sm text-neutral-500">Loading…</p>
          ) : todayDrill === null ? (
            <p className="font-body text-sm text-neutral-500">No Golfable scheduled for today yet.</p>
          ) : (
            <>
              <p className="font-body mb-2 text-sm text-neutral-500">
                {todayDrill.name} &middot; {CATEGORY_INFO[todayDrill.category].label}
              </p>
              <LeaderboardBoard drill={todayDrill} date={todayISO()} studio={studio} />
            </>
          )}
        </div>
      )}

      {tab === "week" && (
        <div className="mt-4">
          {loadingPast ? (
            <p className="font-body text-center text-sm text-neutral-500">Loading…</p>
          ) : pastDays.length === 0 ? (
            <p className="font-body text-sm text-neutral-500">No previous Golfables yet.</p>
          ) : (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {pastDays.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    className={`font-label flex-none rounded-md border px-3 py-2 text-sm font-semibold ${
                      selectedDate === d.date
                        ? "bg-brand border-transparent text-white"
                        : "border-neutral-300 text-neutral-600"
                    }`}
                  >
                    {formatWeekday(d.date)}
                  </button>
                ))}
              </div>
              {selectedPastEntry && (
                <>
                  <p className="font-body mt-3 mb-2 text-sm text-neutral-500">
                    {selectedPastEntry.drill.name} &middot; {CATEGORY_INFO[selectedPastEntry.drill.category].label}
                    &middot; {formatShortDate(selectedPastEntry.date)}
                  </p>
                  <LeaderboardBoard drill={selectedPastEntry.drill} date={selectedPastEntry.date} studio={studio} />
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="mt-4 space-y-2">
          {!myWeek ? (
            <p className="font-body text-center text-sm text-neutral-500">Loading…</p>
          ) : myWeek.length === 0 ? (
            <p className="font-body text-sm text-neutral-500">No previous Golfables yet.</p>
          ) : (
            myWeek.map(({ entry, rank }) => (
              <Link
                key={entry.date}
                to={`/app/leaderboard/${entry.drill.id}/${entry.date}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5"
              >
                <div className="w-10 flex-none">
                  <p className="font-label text-sm font-semibold">{formatWeekday(entry.date)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
                  <p className="font-body text-xs text-neutral-500">
                    {entry.completed
                      ? `Scored ${formatScore(entry.score as number, entry.maxScore, entry.drill.scoreDirection)}`
                      : "Not played"}
                  </p>
                </div>
                {rank > 0 && (
                  <span className="font-label bg-gold flex-none rounded-full px-3 py-1 text-sm font-semibold text-white">
                    #{rank}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
