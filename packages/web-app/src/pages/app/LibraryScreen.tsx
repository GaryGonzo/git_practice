import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import {
  getPastGolfables,
  getUpcomingGolfables,
  getDrillForDate,
  todayISO,
  type PastGolfableEntry,
  type GolfableCalendarEntry,
} from "../../lib/golfableApi";

// Cap the Upcoming list at a short, scannable preview -- even once the
// content calendar is planned out a month or two ahead, the list view
// stays useful instead of scrolling forever. The Calendar view has no
// such cap since it's already naturally bounded to one month at a time.
const UPCOMING_LIST_LIMIT = 6;

const CATEGORY_BG: Record<string, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function CategoryBadge({ category }: { category: SkillCategory }) {
  return (
    <div
      className={`font-display flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm text-white ${CATEGORY_BG[category]}`}
    >
      {CATEGORY_INFO[category].badge}
    </div>
  );
}

function ChevronIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`${className} transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PastRow({ entry }: { entry: PastGolfableEntry }) {
  return (
    <Link
      to={`/app/library/${entry.date}`}
      className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 active:bg-neutral-50"
    >
      <CategoryBadge category={entry.drill.category} />
      <div className="min-w-0 flex-1">
        <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
        <p className="font-body text-sm text-neutral-500">{formatDate(entry.date)}</p>
      </div>
      {entry.completed ? (
        <span className="font-label bg-brand/10 text-brand flex-none rounded-full px-3 py-1 text-sm font-semibold">
          {entry.score}/{entry.maxScore}
        </span>
      ) : (
        <span className="font-label flex-none rounded-full border border-neutral-300 px-3 py-1 text-sm font-semibold text-neutral-500">
          Incomplete
        </span>
      )}
    </Link>
  );
}

function UpcomingRow({ entry }: { entry: GolfableCalendarEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <CategoryBadge category={entry.drill.category} />
        <div className="min-w-0 flex-1">
          <p className="font-label truncate text-sm font-semibold">{entry.drill.name}</p>
          <p className="font-body text-sm text-neutral-500">{formatDate(entry.date)}</p>
        </div>
        <ChevronIcon open={open} className="h-5 w-5 flex-none text-neutral-400" />
      </button>
      {open && (
        <p className="font-body mt-3 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
          {entry.drill.setup.description}
        </p>
      )}
    </div>
  );
}

function CalendarView({
  entries,
}: {
  entries: Map<string, { category: string; completed?: boolean; isToday: boolean; isFuture: boolean }>;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <p className="font-label mb-3 text-center text-sm font-semibold tracking-wide text-neutral-600">
        {monthLabel}
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="font-label text-center text-sm font-semibold text-neutral-400">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entry = entries.get(iso);
          const content = (
            <div
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-sm ${
                entry?.isToday
                  ? "border-brand bg-brand/5"
                  : entry
                    ? "border-neutral-200 bg-white"
                    : "border-transparent text-neutral-300"
              }`}
            >
              <span className="font-body">{day}</span>
              {entry && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${CATEGORY_BG[entry.category]} ${
                    entry.completed === false ? "opacity-40" : ""
                  }`}
                />
              )}
            </div>
          );
          if (entry && !entry.isFuture) {
            return (
              <Link key={i} to={entry.isToday ? "/app" : `/app/library/${iso}`}>
                {content}
              </Link>
            );
          }
          return <div key={i}>{content}</div>;
        })}
      </div>
      <div className="font-body mt-4 flex justify-center gap-4 text-sm text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="bg-brand h-1.5 w-1.5 rounded-full" /> Played
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-brand h-1.5 w-1.5 rounded-full opacity-40" /> Missed / Upcoming
        </span>
      </div>
    </div>
  );
}

export function LibraryScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;

  const [view, setView] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState(true);
  const [past, setPast] = useState<PastGolfableEntry[]>([]);
  const [upcoming, setUpcoming] = useState<GolfableCalendarEntry[]>([]);
  const [today, setToday] = useState<GolfableCalendarEntry | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [pastEntries, upcomingEntries, todayEntry] = await Promise.all([
        getPastGolfables(userId),
        getUpcomingGolfables(),
        getDrillForDate(todayISO()),
      ]);
      setPast(pastEntries);
      setUpcoming(upcomingEntries);
      setToday(todayEntry ? { date: todayISO(), drill: todayEntry.drill, maxScore: todayEntry.maxScore } : null);
      setLoading(false);
    })();
  }, [userId]);

  const calendarEntries = new Map<
    string,
    { category: string; completed?: boolean; isToday: boolean; isFuture: boolean }
  >();
  past.forEach((e) =>
    calendarEntries.set(e.date, { category: e.drill.category, completed: e.completed, isToday: false, isFuture: false })
  );
  if (today) {
    calendarEntries.set(today.date, { category: today.drill.category, isToday: true, isFuture: false });
  }
  upcoming.forEach((e) => calendarEntries.set(e.date, { category: e.drill.category, isToday: false, isFuture: true }));

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-wide">Library</h1>
        <div className="flex rounded-full border border-neutral-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`font-label rounded-full px-3 py-1 text-sm font-semibold ${
              view === "list" ? "bg-brand text-white" : "text-neutral-500"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`font-label rounded-full px-3 py-1 text-sm font-semibold ${
              view === "calendar" ? "bg-brand text-white" : "text-neutral-500"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {loading ? (
        <p className="font-body text-center text-sm text-neutral-500">Loading…</p>
      ) : view === "calendar" ? (
        <CalendarView entries={calendarEntries} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
              Past Golfables
            </h2>
            {past.length === 0 ? (
              <p className="font-body text-sm text-neutral-500">Nothing here yet.</p>
            ) : (
              <div className="space-y-2">
                {past.map((entry) => (
                  <PastRow key={entry.date} entry={entry} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
              Upcoming Golfables
            </h2>
            {upcoming.length === 0 ? (
              <p className="font-body text-sm text-neutral-500">Nothing scheduled yet.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, UPCOMING_LIST_LIMIT).map((entry) => (
                  <UpcomingRow key={entry.date} entry={entry} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
