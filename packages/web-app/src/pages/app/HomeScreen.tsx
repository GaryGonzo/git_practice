import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, type Drill } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { CategoryIcon } from "../../components/CategoryIcon";
import { PageHeader, ChevronRight } from "../../components/ui";
import { getAllDrills, getScoreHistory, getMyScoreForDate, todayISO } from "../../lib/golfableApi";
import { AREA_OPTIONS, SESSION_LENGTHS, generateSession, type Area, type PracticeSession } from "../../lib/drillGenerator";

// Golfable, dumbed down on purpose: pick an area and a length, tap one
// button, play the drills. Each drill opens the normal play screen, so
// scores still feed the Golfable Score and weekly goal. Today's session is
// kept on this device so leaving to play a drill doesn't lose it.

const SESSION_KEY = "golfable-practice-today";
const PREFS_KEY = "golfable-practice-prefs";

function loadSession(): PracticeSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PracticeSession;
    return s.date === todayISO() ? s : null;
  } catch {
    return null;
  }
}

function storeSession(s: PracticeSession | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode or storage full -- the session still works for this visit.
  }
}

function loadPrefs(): { area: Area; minutes: number } {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    return {
      area: AREA_OPTIONS.some((a) => a.value === p.area) ? p.area : "mix",
      minutes: SESSION_LENGTHS.includes(p.minutes) ? p.minutes : 45,
    };
  } catch {
    return { area: "mix", minutes: 45 };
  }
}

function daysAgoISO(days: number): string {
  const d = new Date(`${todayISO()}T12:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  cols,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  cols: string;
}) {
  return (
    <div>
      <p className="font-label text-sm font-semibold text-neutral-500">{label}</p>
      <div className={`mt-2 grid gap-2 ${cols}`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`font-label rounded-xl py-2.5 text-center text-base font-bold ring-1 transition ${
              o.value === value ? "bg-brand text-white ring-brand" : "bg-white text-neutral-700 ring-black/[0.08] active:bg-neutral-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Picker({
  area,
  minutes,
  onArea,
  onMinutes,
}: {
  area: Area;
  minutes: number;
  onArea: (a: Area) => void;
  onMinutes: (m: number) => void;
}) {
  return (
    <div className="space-y-4">
      <Chips label="What are you working on?" options={AREA_OPTIONS} value={area} onChange={onArea} cols="grid-cols-5" />
      <Chips
        label="How long do you have?"
        options={SESSION_LENGTHS.map((m) => ({ value: m, label: `${m} min` }))}
        value={minutes}
        onChange={onMinutes}
        cols="grid-cols-3"
      />
    </div>
  );
}

export function HomeScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [prefs, setPrefs] = useState(loadPrefs);
  const [practice, setPractice] = useState<PracticeSession | null>(loadSession);
  const [library, setLibrary] = useState<Drill[] | null>(null);
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllDrills().then((rows) => setLibrary(rows.map((r) => r.drill)));
    getScoreHistory(userId).then((history) => {
      const cutoff = daysAgoISO(7);
      setRecent(new Set(history.filter((h) => h.date >= cutoff).map((h) => h.drill.id)));
    });
  }, [userId]);

  // A drill counts as done once a score for it is logged today.
  useEffect(() => {
    if (!practice) return;
    const today = todayISO();
    Promise.all(practice.drills.map(async (d) => ((await getMyScoreForDate(userId, d.drillId, today)) !== null ? d.drillId : null))).then(
      (ids) => setPlayed(new Set(ids.filter((id): id is string => id !== null)))
    );
  }, [practice, userId]);

  function updatePrefs(next: { area: Area; minutes: number }) {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function generate() {
    if (!library || library.length === 0) {
      setError("Couldn't load the drill library -- check your connection and try again.");
      return;
    }
    setError(null);
    const next = generateSession(library, prefs.minutes, prefs.area, todayISO(), recent);
    setPractice(next);
    storeSession(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clear() {
    setPractice(null);
    storeSession(null);
  }

  const doneCount = practice ? practice.drills.filter((d) => played.has(d.drillId)).length : 0;
  const allDone = practice !== null && practice.drills.length > 0 && doneCount === practice.drills.length;
  const areaLabel = practice ? (AREA_OPTIONS.find((a) => a.value === practice.area)?.label ?? "Mix") : "";

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <PageHeader kicker="Golfable" title={practice ? "Today's session" : "Practice"} sub="Pick an area and a length. We'll build the session." />

      {!practice ? (
        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
          <Picker area={prefs.area} minutes={prefs.minutes} onArea={(area) => updatePrefs({ ...prefs, area })} onMinutes={(minutes) => updatePrefs({ ...prefs, minutes })} />
          <button
            type="button"
            onClick={generate}
            disabled={!library}
            className="font-label bg-brand mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-bold text-white shadow-lg shadow-black/10 active:scale-[0.99] disabled:opacity-60"
          >
            <SparkIcon className="h-5 w-5" />
            {library ? "Generate today's session" : "Loading drills…"}
          </button>
          {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <>
          <div className="bg-brand-dark mt-5 flex items-center justify-between rounded-2xl px-5 py-4 text-white">
            <div>
              <p className="font-display text-3xl leading-none">
                {practice.minutes} min · {areaLabel}
              </p>
              <p className="font-body mt-1 text-sm text-white/70">
                {practice.drills.length} {practice.drills.length === 1 ? "drill" : "drills"} · about {practice.estimatedMinutes} min
              </p>
            </div>
            <div className="text-right">
              <p className={`font-display text-3xl leading-none ${allDone ? "text-gold" : ""}`}>
                {doneCount}/{practice.drills.length}
              </p>
              <p className="font-body mt-1 text-sm text-white/70">{allDone ? "Done. Nice work." : "played"}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {practice.drills.map((d, i) => {
              const done = played.has(d.drillId);
              const info = CATEGORY_INFO[d.category];
              return (
                <Link
                  key={d.drillId}
                  to={`/app/play/${d.drillId}`}
                  className={`flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] active:bg-neutral-50 ${done ? "opacity-60" : ""}`}
                >
                  <span
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: done ? "#1f4d36" : info.color }}
                  >
                    {done ? <CheckIcon className="h-5 w-5" /> : <CategoryIcon category={d.category} className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-label block text-sm font-semibold text-neutral-500">
                      {i + 1}. {info.label} · ~{d.minutes} min
                    </span>
                    <span className={`font-label block text-[1.1rem] leading-tight font-semibold text-neutral-900 ${done ? "line-through" : ""}`}>{d.name}</span>
                    <span className="font-body mt-0.5 block truncate text-sm text-neutral-500">{d.equipment.join(" · ")}</span>
                  </span>
                  <span className="flex flex-none items-center gap-0.5">
                    <span className="font-label text-brand text-sm font-bold">{done ? "Played" : "Play"}</span>
                    <ChevronRight className="text-brand h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="font-body mt-3 text-sm text-neutral-500">Tap a drill to see the rules and log your score.</p>

          <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <Picker area={prefs.area} minutes={prefs.minutes} onArea={(area) => updatePrefs({ ...prefs, area })} onMinutes={(minutes) => updatePrefs({ ...prefs, minutes })} />
            <button
              type="button"
              onClick={generate}
              className="font-label bg-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-white"
            >
              <SparkIcon className="h-4 w-4" />
              Generate a new session
            </button>
            <button type="button" onClick={clear} className="font-label mt-2 w-full py-2 text-sm font-semibold text-neutral-500">
              Clear today's session
            </button>
          </div>
        </>
      )}
    </div>
  );
}
