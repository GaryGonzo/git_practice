import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getFitRoutineForDate,
  getFitRoutineChecks,
  setFitRoutineCheck,
  getFitDailyLogs,
  saveFitDailyLog,
  getFitNutritionPlan,
  getFitProfile,
  getActiveFitBlock,
  getWorkoutInstancesOnDate,
  startWorkout,
  getFitStepLogHistory,
  logFitSteps,
  getFitBodyLogHistory,
  logFitBodyWeight,
  addDaysISO,
  todayISO,
  type FitRoutineItem,
  type FitRoutineKind,
  type FitBlock,
  type FitWorkoutInstance,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ className, dir }: { className?: string; dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d={dir === "left" ? "M12.5 4.5L7 10l5.5 5.5" : "M7.5 4.5L13 10l-5.5 5.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDateLong(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function pacificNowHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

const KIND_DOT: Record<FitRoutineKind, string> = {
  wake: "bg-fit-finisher",
  sleep: "bg-fit-finisher",
  recovery: "bg-fit-finisher",
  meal: "bg-fit-circuit",
  walk: "bg-fit-recover",
  mobility: "bg-fit-recover",
  lift: "bg-brand",
  golf: "bg-gold",
  work: "bg-neutral-400",
  habit: "bg-fit-warmup",
  checkin: "bg-brand",
};

// ---------------------------------------------------------------------------
// Habit tiles: water, sleep, steps, weight -- the four numbers the plan
// tracks every day, one tap each.

function Tile({ label, children, accent }: { label: string; children: React.ReactNode; accent: string }) {
  return (
    <div className={`rounded-lg border border-l-4 border-neutral-200 bg-white p-3 ${accent}`}>
      <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">{label}</p>
      {children}
    </div>
  );
}

function WaterTile({ oz, goal, onChange }: { oz: number; goal: number | null; onChange: (oz: number) => void }) {
  const pct = goal ? Math.min(100, Math.round((oz / goal) * 100)) : 0;
  return (
    <Tile label="Water" accent="border-l-fit-warmup">
      <p className="font-display mt-1 text-2xl">
        {oz}
        <span className="text-sm font-normal text-neutral-500"> {goal ? `/ ${goal} oz` : "oz"}</span>
      </p>
      {goal && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="bg-fit-warmup h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, oz - 8))}
          disabled={oz <= 0}
          className="font-label rounded-md border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-600 disabled:opacity-40"
        >
          −8
        </button>
        <button
          type="button"
          onClick={() => onChange(oz + 8)}
          className="font-label bg-fit-warmup/10 text-fit-warmup flex-1 rounded-md px-2 py-1 text-xs font-semibold"
        >
          +8
        </button>
        <button
          type="button"
          onClick={() => onChange(oz + 20)}
          className="font-label bg-fit-warmup/10 text-fit-warmup flex-1 rounded-md px-2 py-1 text-xs font-semibold"
        >
          +20
        </button>
      </div>
    </Tile>
  );
}

function SleepTile({
  hours,
  goal,
  onChange,
}: {
  hours: number | null;
  goal: number | null;
  onChange: (hours: number) => void;
}) {
  const shown = hours ?? goal ?? 7.5;
  return (
    <Tile label="Sleep last night" accent="border-l-fit-finisher">
      <p className={`font-display mt-1 text-2xl ${hours === null ? "text-neutral-300" : ""}`}>
        {shown.toFixed(1)}
        <span className="text-sm font-normal text-neutral-500"> {goal ? `/ ${goal} hrs` : "hrs"}</span>
      </p>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, shown - 0.5))}
          className="font-label rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-600"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onChange(shown)}
          className={`font-label flex-1 rounded-md px-2 py-1 text-xs font-semibold ${
            hours === null ? "bg-fit-finisher text-white" : "bg-fit-finisher/10 text-fit-finisher"
          }`}
        >
          {hours === null ? "Log" : "Logged"}
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(16, shown + 0.5))}
          className="font-label rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-600"
        >
          +
        </button>
      </div>
    </Tile>
  );
}

function NumberEntryTile({
  label,
  accent,
  display,
  sub,
  placeholder,
  inputMode,
  onSave,
}: {
  label: string;
  accent: string;
  display: string | null;
  sub: string | null;
  placeholder: string;
  inputMode: "numeric" | "decimal";
  onSave: (value: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    setSaving(true);
    try {
      await onSave(num);
      setEditing(false);
      setValue("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tile label={label} accent={accent}>
      {editing ? (
        <form onSubmit={handleSubmit} className="mt-1.5 flex gap-1.5">
          <input
            autoFocus
            type="number"
            inputMode={inputMode}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="font-body w-full min-w-0 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !value}
            className="font-label bg-brand flex-none rounded-md px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? "…" : "Save"}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-1 block w-full text-left">
          <p className={`font-display text-2xl ${display ? "" : "text-neutral-300"}`}>{display ?? "—"}</p>
          <p className="font-label text-brand text-xs font-semibold">{sub ?? "Tap to log"}</p>
        </button>
      )}
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// One line of the day.

function RoutineRow({
  item,
  done,
  autoDone,
  upNext,
  action,
  onToggle,
}: {
  item: FitRoutineItem;
  done: boolean;
  autoDone: boolean;
  upNext: boolean;
  action: React.ReactNode;
  onToggle: () => void;
}) {
  const checked = done || autoDone;
  return (
    <div
      className={`flex gap-3 rounded-lg border bg-white p-3 ${
        upNext ? "border-brand/50 ring-brand/20 ring-2" : "border-neutral-200"
      } ${checked ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={autoDone}
        aria-label={checked ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 ${
          checked ? "bg-brand border-brand text-white" : "border-neutral-300 text-transparent"
        }`}
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={`h-2 w-2 flex-none rounded-full ${KIND_DOT[item.kind]}`} aria-hidden="true" />
          <span className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {item.timeOfDay ? formatTime12h(item.timeOfDay) : "Anytime"}
          </span>
          {upNext && (
            <span className="font-label bg-brand rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
              Up next
            </span>
          )}
        </div>
        <p className={`font-label mt-0.5 text-base font-semibold ${checked ? "line-through" : ""}`}>{item.title}</p>
        {item.detail && <p className="font-body text-sm text-neutral-600">{item.detail}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export function FitTodayScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FitRoutineItem[]>([]);
  const [checks, setChecks] = useState<Set<string>>(new Set());
  const [waterOz, setWaterOz] = useState(0);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [waterGoal, setWaterGoal] = useState<number | null>(null);
  const [sleepGoal, setSleepGoal] = useState<number | null>(null);
  const [block, setBlock] = useState<FitBlock | null>(null);
  const [instances, setInstances] = useState<FitWorkoutInstance[]>([]);
  const [steps, setSteps] = useState<number | null>(null);
  const [stepGoal, setStepGoal] = useState<number | null>(null);
  const [lastWeight, setLastWeight] = useState<{ lbs: number; on: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(pacificNowHHMM());

  useEffect(() => {
    const timer = setInterval(() => setNow(pacificNowHHMM()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Targets and the active block don't depend on the date shown.
  useEffect(() => {
    Promise.all([getFitNutritionPlan(userId), getFitProfile(userId), getActiveFitBlock(userId)]).then(([n, p, b]) => {
      setWaterGoal(n?.waterGoalOz ?? null);
      setSleepGoal(p?.sleepGoalHours ?? null);
      setBlock(b);
      setStepGoal(b?.stepGoal ?? null);
    });
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFitRoutineForDate(userId, date),
      getFitRoutineChecks(userId, date),
      getFitDailyLogs(userId, date, date),
      getWorkoutInstancesOnDate(userId, date),
      getFitStepLogHistory(userId),
      getFitBodyLogHistory(userId),
    ]).then(([routine, checked, logs, inst, stepHistory, bodyHistory]) => {
      setItems(routine);
      setChecks(checked);
      setWaterOz(logs[0]?.waterOz ?? 0);
      setSleepHours(logs[0]?.sleepHours ?? null);
      setInstances(inst);
      setSteps(stepHistory.find((s) => s.loggedDate === date)?.steps ?? null);
      const latest = bodyHistory.length > 0 ? bodyHistory[bodyHistory.length - 1] : null;
      setLastWeight(
        latest
          ? {
              lbs: latest.weightLbs,
              on: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(latest.recordedAt)),
            }
          : null
      );
      setLoading(false);
    });
  }, [userId, date]);

  const isToday = date === todayISO();

  function templateFor(item: FitRoutineItem) {
    if (item.kind !== "lift" || item.templateIndex === null || !block || block.templates.length === 0) return null;
    return block.templates[item.templateIndex % block.templates.length] ?? null;
  }

  function instanceFor(item: FitRoutineItem) {
    const template = templateFor(item);
    if (!template) return null;
    return instances.find((i) => i.sessionTemplateId === template.id) ?? null;
  }

  const isAutoDone = (item: FitRoutineItem) => instanceFor(item)?.status === "completed";
  const isDone = (item: FitRoutineItem) => checks.has(item.id) || isAutoDone(item);

  const doneCount = items.filter(isDone).length;

  const upNextId = useMemo(() => {
    if (!isToday) return null;
    const next = items.find((i) => !isDone(i) && i.timeOfDay !== null && i.timeOfDay >= now.slice(0, 5));
    return next?.id ?? null;
  }, [items, checks, instances, block, now, isToday]);

  async function handleToggle(item: FitRoutineItem) {
    const done = !checks.has(item.id);
    setChecks((prev) => {
      const next = new Set(prev);
      if (done) next.add(item.id);
      else next.delete(item.id);
      return next;
    });
    try {
      await setFitRoutineCheck(userId, item.id, date, done);
    } catch {
      setChecks(await getFitRoutineChecks(userId, date));
    }
  }

  async function handleWater(oz: number) {
    setWaterOz(oz);
    await saveFitDailyLog(userId, date, { waterOz: oz });
  }

  async function handleSleep(hours: number) {
    setSleepHours(hours);
    await saveFitDailyLog(userId, date, { sleepHours: hours });
  }

  async function handleStart(templateId: string) {
    if (!block) return;
    setStarting(true);
    try {
      const id = await startWorkout(userId, block.id, templateId);
      navigate(`/app/fit/workout/${id}`);
    } finally {
      setStarting(false);
    }
  }

  function actionFor(item: FitRoutineItem): React.ReactNode {
    const linkClass = "font-label inline-flex rounded-md px-3 py-1.5 text-sm font-semibold";
    if (item.kind === "lift") {
      const template = templateFor(item);
      if (!template) return null;
      const instance = instanceFor(item);
      if (instance?.status === "completed") {
        return (
          <Link to={`/app/fit/workout/${instance.id}`} className={`${linkClass} bg-brand/10 text-brand`}>
            Done: {template.name}
          </Link>
        );
      }
      if (instance) {
        return (
          <Link to={`/app/fit/workout/${instance.id}`} className={`${linkClass} bg-gold text-white`}>
            Resume {template.name}
          </Link>
        );
      }
      if (!isToday) return <p className="font-body text-sm text-neutral-500">{template.name}</p>;
      return (
        <button
          type="button"
          disabled={starting}
          onClick={() => handleStart(template.id)}
          className={`${linkClass} bg-brand text-white disabled:opacity-60`}
        >
          {starting ? "Starting…" : `Start ${template.name}`}
        </button>
      );
    }
    if (item.kind === "golf") {
      return item.title.toLowerCase().includes("round") ? (
        <Link to="/app/round" className={`${linkClass} bg-gold/15 text-neutral-800`}>
          Open round tracker
        </Link>
      ) : (
        <Link to="/app/today" className={`${linkClass} bg-gold/15 text-neutral-800`}>
          Today's Golfable
        </Link>
      );
    }
    if (item.kind === "checkin") {
      return (
        <Link to="/app/fit/checkin" className={`${linkClass} bg-brand text-white`}>
          Start check-in
        </Link>
      );
    }
    return null;
  }

  const weighedToday = lastWeight?.on === date;

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-24">
      <Link to="/app/fit" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Golfable Fit
      </Link>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2">
        <button type="button" onClick={() => setDate((d) => addDaysISO(d, -1))} className="p-2 text-neutral-500" aria-label="Previous day">
          <ChevronIcon dir="left" className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-display text-xl tracking-wide">{isToday ? "Today" : formatDateLong(date)}</p>
          <p className="font-label text-xs font-semibold text-neutral-500">{isToday ? formatDateLong(date) : ""}</p>
        </div>
        <button type="button" onClick={() => setDate((d) => addDaysISO(d, 1))} className="p-2 text-neutral-500" aria-label="Next day">
          <ChevronIcon dir="right" className="h-5 w-5" />
        </button>
      </div>

      {!isToday && (
        <button
          type="button"
          onClick={() => setDate(todayISO())}
          className="font-label text-brand mt-2 block w-full text-center text-sm font-semibold underline"
        >
          Back to today
        </button>
      )}

      {loading ? (
        <div className="p-6 text-center font-body text-neutral-500">Loading…</div>
      ) : (
        <>
          {items.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Day progress</p>
                <p className="font-label text-sm font-semibold text-neutral-700">
                  {doneCount}/{items.length}
                </p>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="bg-brand h-full rounded-full transition-all"
                  style={{ width: `${Math.round((doneCount / items.length) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <WaterTile oz={waterOz} goal={waterGoal} onChange={handleWater} />
            <SleepTile hours={sleepHours} goal={sleepGoal} onChange={handleSleep} />
            <NumberEntryTile
              label="Steps"
              accent="border-l-gold"
              display={steps !== null ? steps.toLocaleString() : null}
              sub={
                steps !== null && stepGoal
                  ? steps >= stepGoal
                    ? "Goal hit"
                    : `${(stepGoal - steps).toLocaleString()} to go`
                  : stepGoal
                    ? `Goal ${stepGoal.toLocaleString()}`
                    : null
              }
              placeholder="8400"
              inputMode="numeric"
              onSave={async (n) => {
                await logFitSteps(userId, Math.round(n));
                setSteps(Math.round(n));
              }}
            />
            <NumberEntryTile
              label="Weight"
              accent="border-l-fit-recover"
              display={lastWeight ? `${lastWeight.lbs}` : null}
              sub={weighedToday ? "Weighed in today" : lastWeight ? "Tap to weigh in" : null}
              placeholder="219.4"
              inputMode="decimal"
              onSave={async (n) => {
                await logFitBodyWeight(userId, n);
                setLastWeight({ lbs: n, on: todayISO() });
              }}
            />
          </div>

          <p className="font-label mt-5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">The plan</p>
          {items.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-center">
              <p className="font-body text-sm text-neutral-500">Nothing scheduled for this day.</p>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <RoutineRow
                  key={item.id}
                  item={item}
                  done={checks.has(item.id)}
                  autoDone={isAutoDone(item)}
                  upNext={item.id === upNextId}
                  action={actionFor(item)}
                  onToggle={() => handleToggle(item)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
