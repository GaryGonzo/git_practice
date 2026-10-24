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
  getWorkoutSession,
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
import { FairwayPanel, Meter, ChevronLeft, ChevronRight } from "../../components/ui";
import { FitBlockPanel } from "../../components/FitBlockPanel";
import { FitIdentityCard } from "../../components/FitIdentityCard";
import { FitStreaksPanel } from "../../components/FitStreaksPanel";
import { ScreenSkeleton } from "../../components/FitPanelStates";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatTime12h(time: string): { clock: string; period: string } {
  const [h, m] = time.split(":").map(Number);
  return { clock: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}`, period: h >= 12 ? "PM" : "AM" };
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

const KIND_COLOR: Record<FitRoutineKind, string> = {
  wake: "bg-fit-finisher",
  sleep: "bg-fit-finisher",
  recovery: "bg-fit-finisher",
  meal: "bg-fit-circuit",
  walk: "bg-fit-recover",
  mobility: "bg-fit-recover",
  lift: "bg-brand",
  golf: "bg-gold",
  work: "bg-neutral-300",
  habit: "bg-fit-warmup",
  checkin: "bg-brand",
};

// The day reads like a scorecard split into nines: anytime items first,
// then the clock in four stretches.
const PARTS = [
  { id: "anytime", label: "Anytime today", test: (t: string | null) => t === null },
  { id: "morning", label: "Morning", test: (t: string | null) => t !== null && t < "09:00" },
  { id: "workday", label: "Workday", test: (t: string | null) => t !== null && t >= "09:00" && t < "15:00" },
  { id: "after", label: "After work", test: (t: string | null) => t !== null && t >= "15:00" && t < "18:00" },
  { id: "evening", label: "Evening", test: (t: string | null) => t !== null && t >= "18:00" },
];

// ---------------------------------------------------------------------------
// The four daily numbers, as cells of one panel.

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-3.5">
      <p className="font-label text-sm font-semibold text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

function StepButton({ onClick, disabled, children, primary }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-label h-11 flex-1 rounded-lg text-sm font-bold disabled:opacity-40 ${
        primary ? "bg-fit-warmup/10 text-fit-warmup" : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {children}
    </button>
  );
}

function WaterCell({ oz, goal, onChange }: { oz: number; goal: number | null; onChange: (oz: number) => void }) {
  return (
    <Cell label="Water">
      <p className="font-display mt-0.5 text-3xl leading-none">
        {oz}
        <span className="font-label text-base text-neutral-400"> / {goal ?? "–"} oz</span>
      </p>
      {goal && (
        <div className="mt-2">
          <Meter value={oz} max={goal} tone="bg-fit-warmup" />
        </div>
      )}
      <div className="mt-2.5 flex gap-1.5">
        <StepButton onClick={() => onChange(Math.max(0, oz - 8))} disabled={oz <= 0}>
          −8
        </StepButton>
        <StepButton onClick={() => onChange(oz + 8)} primary>
          +8
        </StepButton>
        <StepButton onClick={() => onChange(oz + 20)} primary>
          +20
        </StepButton>
      </div>
    </Cell>
  );
}

function SleepCell({ hours, goal, onChange }: { hours: number | null; goal: number | null; onChange: (hours: number) => void }) {
  const shown = hours ?? goal ?? 7.5;
  return (
    <Cell label="Sleep last night">
      <p className={`font-display mt-0.5 text-3xl leading-none ${hours === null ? "text-neutral-300" : ""}`}>
        {shown.toFixed(1)}
        <span className="font-label text-base text-neutral-400"> / {goal ?? "–"} hrs</span>
      </p>
      <div className="mt-[18px] flex gap-1.5">
        <StepButton onClick={() => onChange(Math.max(0, shown - 0.5))}>−</StepButton>
        <button
          type="button"
          onClick={() => onChange(shown)}
          className={`font-label h-11 flex-[2] rounded-lg text-sm font-bold ${
            hours === null ? "bg-fit-finisher text-white" : "bg-fit-finisher/10 text-fit-finisher"
          }`}
        >
          {hours === null ? "Log" : "Logged"}
        </button>
        <StepButton onClick={() => onChange(Math.min(16, shown + 0.5))}>+</StepButton>
      </div>
    </Cell>
  );
}

function EntryCell({
  label,
  display,
  unit,
  sub,
  subTone = "text-neutral-500",
  placeholder,
  inputMode,
  onSave,
}: {
  label: string;
  display: string | null;
  unit: string;
  sub: string | null;
  subTone?: string;
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
    <Cell label={label}>
      {editing ? (
        <form onSubmit={handleSubmit} className="mt-1.5 flex gap-1.5">
          <input
            autoFocus
            type="number"
            inputMode={inputMode}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
            className="font-display focus:border-brand w-full min-w-0 rounded-lg border border-neutral-300 px-2 py-1 text-xl outline-none"
          />
          <button
            type="submit"
            disabled={saving || !value}
            className="font-label bg-brand flex-none rounded-lg px-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "…" : "Save"}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-0.5 block w-full text-left">
          <p className={`font-display text-3xl leading-none ${display ? "" : "text-neutral-300"}`}>
            {display ?? "—"}
            {display && <span className="font-label text-base text-neutral-400"> {unit}</span>}
          </p>
          <p className={`font-label mt-2 text-sm font-semibold ${subTone}`}>{sub ?? "Tap to log"}</p>
        </button>
      )}
    </Cell>
  );
}

// ---------------------------------------------------------------------------
// One line of the day's scorecard. Tap the line to see the details; tap the
// circle to check it off.

function PlanRow({
  item,
  checked,
  locked,
  upNext,
  action,
  onToggle,
}: {
  item: FitRoutineItem;
  checked: boolean;
  locked: boolean;
  upNext: boolean;
  action: React.ReactNode;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const time = item.timeOfDay ? formatTime12h(item.timeOfDay) : null;
  return (
    <div className={`relative ${upNext ? "bg-brand/[0.04]" : ""}`}>
      {upNext && <span className="bg-brand absolute inset-y-0 left-0 w-1" aria-hidden="true" />}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-2 pl-4 text-left"
        >
          <span className="w-12 flex-none text-right">
            {time ? (
              <>
                <span className={`font-display block text-xl leading-none ${checked ? "text-neutral-300" : "text-neutral-800"}`}>{time.clock}</span>
                <span className="font-label block text-[0.7rem] font-semibold text-neutral-400">{time.period}</span>
              </>
            ) : (
              <span className="font-label text-sm font-semibold text-neutral-400">Any</span>
            )}
          </span>
          <span className={`h-8 w-1 flex-none rounded-full ${checked ? "bg-neutral-200" : KIND_COLOR[item.kind]}`} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span
              className={`font-label block text-[1.05rem] leading-tight font-semibold ${
                checked ? "text-neutral-400 line-through decoration-neutral-300" : "text-neutral-900"
              }`}
            >
              {item.title}
            </span>
            {upNext && <span className="font-label text-brand block text-sm font-semibold">Up next</span>}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={locked}
          aria-label={checked ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
          className="flex flex-none items-center px-4"
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
              checked ? "bg-brand border-brand text-white" : "border-neutral-300 text-transparent"
            }`}
          >
            <CheckIcon className="h-4 w-4" />
          </span>
        </button>
      </div>
      {(open || (upNext && action)) && (item.detail || action) && (
        <div className="pr-4 pb-3.5 pl-[5.75rem]">
          {open && item.detail && <p className="font-body text-sm leading-relaxed text-neutral-600">{item.detail}</p>}
          {action && <div className={open && item.detail ? "mt-2.5" : ""}>{action}</div>}
        </div>
      )}
    </div>
  );
}

// The day as plain text for pasting into Miyagi (Gary's Grok coach). Kept
// short and in a fixed order so the coach can read it the same way daily.
async function buildMiyagiSummary(args: {
  date: string;
  items: FitRoutineItem[];
  isDone: (item: FitRoutineItem) => boolean;
  instances: FitWorkoutInstance[];
  steps: number | null;
  stepGoal: number | null;
  waterOz: number;
  waterGoal: number | null;
  sleepHours: number | null;
  weight: { lbs: number; on: string } | null;
  /** HH:MM now (Pacific) when summarizing today; null for another day. */
  now: string | null;
}): Promise<string> {
  const lines: string[] = [`Golfable Fit check-in, ${formatDateLong(args.date)}`];

  for (const instance of args.instances) {
    const session = await getWorkoutSession(instance.id);
    if (!session) continue;
    const all = session.sections.flatMap((s) => s.sets.flatMap((set) => set.exercises));
    const done = all.filter((e) => e.completed).length;
    lines.push(`Lift: ${session.templateName}, ${instance.status === "completed" ? "done" : "in progress"} (${done}/${all.length} logged)`);
    const main = session.sections.find((s) => s.title.toLowerCase().includes("main"));
    if (main) {
      const sets = main.sets.flatMap((set) => set.exercises).filter((e) => e.completed);
      if (sets.length > 0) {
        const name = sets[0].name;
        const detail = sets
          .map((e) => (e.tracksWeight ? `${e.actualWeightLbs ?? 0}x${e.actualCount ?? e.targetCount ?? 0}` : `${e.actualCount ?? e.targetCount ?? 0}`))
          .join(", ");
        lines.push(`  ${name}: ${detail}`);
      }
    }
  }
  if (args.instances.length === 0 && args.items.some((i) => i.kind === "lift")) lines.push("Lift: not started");

  lines.push(`Steps: ${args.steps !== null ? args.steps.toLocaleString() : "not logged"}${args.stepGoal ? ` / ${args.stepGoal.toLocaleString()}` : ""}`);
  lines.push(`Water: ${args.waterOz}${args.waterGoal ? ` / ${args.waterGoal}` : ""} oz`);
  lines.push(`Sleep last night: ${args.sleepHours !== null ? `${args.sleepHours} hrs` : "not logged"}`);
  lines.push(`Weight: ${args.weight && args.weight.on === args.date ? `${args.weight.lbs} lbs` : "no weigh-in today"}`);

  const done = args.items.filter(args.isDone);
  // Only what's already due counts as missed -- dinner isn't missed at noon.
  const missed = args.items.filter(
    (i) => !args.isDone(i) && (args.now === null || i.timeOfDay === null || i.timeOfDay <= args.now)
  );
  lines.push(`Plan: ${done.length}/${args.items.length} checked off`);
  if (missed.length > 0) lines.push(`Missed so far: ${missed.map((i) => i.title).join("; ")}`);
  return lines.join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / denied permission: fall back to a hidden textarea.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="4.5" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Protein "hits" = protein-anchored meals/snacks today, tapped up to the goal.
function ProteinCell({ hits, goal, onChange }: { hits: number; goal: number; onChange: (hits: number) => void }) {
  const hit = hits >= goal;
  return (
    <div className="bg-white p-4">
      <p className="font-label text-sm font-semibold text-neutral-500">Protein hits</p>
      <p className="font-display text-3xl leading-none text-neutral-900">
        {hits} <span className="font-label text-sm text-neutral-400">of {goal}</span>
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, hits - 1))}
          disabled={hits === 0}
          aria-label="One fewer protein hit"
          className="font-label h-11 w-11 rounded-full bg-neutral-100 text-lg font-bold text-neutral-600 disabled:opacity-40"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(8, hits + 1))}
          aria-label="Log a protein hit"
          className={`font-label h-11 flex-1 rounded-full text-base font-bold ${hit ? "bg-brand/10 text-brand" : "bg-brand text-white"}`}
        >
          {hit ? "Goal hit" : "+1"}
        </button>
      </div>
    </div>
  );
}

function KitchenCell({ closed, onChange }: { closed: boolean | null; onChange: (closed: boolean) => void }) {
  return (
    <div className="bg-white p-4">
      <p className="font-label text-sm font-semibold text-neutral-500">Kitchen closed by 8</p>
      <p className={`font-display text-3xl leading-none ${closed ? "text-brand" : "text-neutral-900"}`}>
        {closed === null ? "—" : closed ? "Yes" : "No"}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`font-label h-11 flex-1 rounded-full text-base font-bold ${closed ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600"}`}
        >
          Closed
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`font-label h-11 flex-1 rounded-full text-base font-bold ${closed === false ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-600"}`}
        >
          Ate late
        </button>
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
  const [proteinHits, setProteinHits] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(4);
  const [kitchenClosed, setKitchenClosed] = useState<boolean | null>(null);
  const [streakKey, setStreakKey] = useState(0);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [waterGoal, setWaterGoal] = useState<number | null>(null);
  const [sleepGoal, setSleepGoal] = useState<number | null>(null);
  const [block, setBlock] = useState<FitBlock | null>(null);
  const [instances, setInstances] = useState<FitWorkoutInstance[]>([]);
  const [steps, setSteps] = useState<number | null>(null);
  const [stepGoal, setStepGoal] = useState<number | null>(null);
  const [lastWeight, setLastWeight] = useState<{ lbs: number; on: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "working" | "copied" | "failed">("idle");
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [now, setNow] = useState(pacificNowHHMM());

  useEffect(() => {
    const timer = setInterval(() => setNow(pacificNowHHMM()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Targets and the active block don't depend on the date shown.
  useEffect(() => {
    Promise.all([getFitNutritionPlan(userId), getFitProfile(userId), getActiveFitBlock(userId)]).then(([n, p, b]) => {
      // 110 oz is the program default until a plan sets its own.
      setWaterGoal(n?.waterGoalOz ?? 110);
      setProteinGoal(n?.proteinHitsGoal ?? 4);
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
      setProteinHits(logs[0]?.proteinHits ?? 0);
      setKitchenClosed(logs[0]?.kitchenClosedBy ?? null);
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

  const upNext = useMemo(() => {
    if (!isToday) return null;
    return items.find((i) => !isDone(i) && i.timeOfDay !== null && i.timeOfDay >= now.slice(0, 5)) ?? null;
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
    setStreakKey((k) => k + 1);
  }

  async function handleProtein(hits: number) {
    setProteinHits(hits);
    await saveFitDailyLog(userId, date, { proteinHits: hits });
    setStreakKey((k) => k + 1);
  }

  async function handleKitchen(closed: boolean) {
    setKitchenClosed(closed);
    await saveFitDailyLog(userId, date, { kitchenClosedBy: closed });
    setStreakKey((k) => k + 1);
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

  // The one action a line offers, if any: start or resume a lift, open the
  // Golfable or round tracker, start the check-in.
  function actionFor(item: FitRoutineItem, onDark = false): React.ReactNode {
    const solid = onDark ? "bg-gold text-brand-dark" : "bg-brand text-white";
    const soft = onDark ? "bg-white/10 text-white" : "bg-brand/10 text-brand";
    const cls = "font-label inline-flex items-center gap-1 rounded-full px-4 py-2 text-[0.95rem] font-bold";
    if (item.kind === "lift") {
      const template = templateFor(item);
      if (!template) return null;
      const instance = instanceFor(item);
      if (instance?.status === "completed") {
        return (
          <Link to={`/app/fit/workout/${instance.id}`} className={`${cls} ${soft}`}>
            Done: {template.name}
          </Link>
        );
      }
      if (instance) {
        return (
          <Link to={`/app/fit/workout/${instance.id}`} className={`${cls} ${solid}`}>
            Resume {template.name}
            <ChevronRight className="h-4 w-4" />
          </Link>
        );
      }
      if (!isToday) return <span className="font-body text-sm text-neutral-500">{template.name}</span>;
      return (
        <button type="button" disabled={starting} onClick={() => handleStart(template.id)} className={`${cls} ${solid} disabled:opacity-60`}>
          {starting ? "Starting…" : `Start ${template.name}`}
          {!starting && <ChevronRight className="h-4 w-4" />}
        </button>
      );
    }
    if (item.kind === "golf") {
      const isRound = item.title.toLowerCase().includes("round");
      return (
        <Link to={isRound ? "/app/round" : "/app/today"} className={`${cls} ${solid}`}>
          {isRound ? "Open round tracker" : "Play today's Golfable"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      );
    }
    if (item.kind === "checkin") {
      return (
        <Link to="/app/fit/checkin" className={`${cls} ${solid}`}>
          Start check-in
          <ChevronRight className="h-4 w-4" />
        </Link>
      );
    }
    return null;
  }

  async function handleCopyForMiyagi() {
    setCopyState("working");
    setCopyFallback(null);
    const text = await buildMiyagiSummary({
      date,
      items,
      isDone,
      instances,
      steps,
      stepGoal,
      waterOz,
      waterGoal,
      sleepHours,
      weight: lastWeight,
      now: isToday ? now.slice(0, 5) : null,
    });
    const ok = await copyText(text);
    if (ok) {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } else {
      // Show the text so it can be copied by hand.
      setCopyState("failed");
      setCopyFallback(text);
    }
  }

  // Primary action at the top: start / resume today's lift.
  const liftItem = items.find((i) => i.kind === "lift" && templateFor(i));
  const liftCta = liftItem && isToday ? actionFor(liftItem, false) : null;

  const weighedToday = lastWeight?.on === date;
  const upNextTime = upNext?.timeOfDay ? formatTime12h(upNext.timeOfDay) : null;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setDate((d) => addDaysISO(d, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-black/[0.06]"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="font-label text-base font-medium text-neutral-500">{isToday ? formatDateLong(date) : "Plan for"}</p>
          <h1 className="font-display text-[2.4rem] leading-none tracking-wide">{isToday ? "Today" : formatDateLong(date)}</h1>
        </div>
        <button
          type="button"
          onClick={() => setDate((d) => addDaysISO(d, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-black/[0.06]"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>
      {!isToday && (
        <button type="button" onClick={() => setDate(todayISO())} className="font-label text-brand mt-1 block w-full text-center text-base font-semibold">
          Back to today
        </button>
      )}

      {loading ? (
        <ScreenSkeleton label="Loading today" />
      ) : (
        <>
          {liftCta && (
            <div className="mt-5 [&>*]:flex [&>*]:min-h-16 [&>*]:w-full [&>*]:justify-center [&>*]:text-xl">{liftCta}</div>
          )}

          <FitIdentityCard block={block} date={date} />

          {items.length > 0 && (
            <FairwayPanel className="mt-5">
              <div className="p-5">
                {upNext && upNextTime ? (
                  <>
                    <p className="font-label text-base font-medium text-white/60">Up next</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <p className="font-display text-gold text-5xl leading-none">{upNextTime.clock}</p>
                      <p className="font-label text-gold/80 text-lg font-semibold">{upNextTime.period}</p>
                    </div>
                    <h2 className="font-display mt-2 text-[2rem] leading-[0.95] tracking-wide">{upNext.title}</h2>
                    {upNext.detail && <p className="font-body mt-1.5 text-sm leading-relaxed text-white/70">{upNext.detail}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {actionFor(upNext, true)}
                      <button
                        type="button"
                        onClick={() => handleToggle(upNext)}
                        className="font-label inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[0.95rem] font-bold text-white"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Mark done
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-label text-base font-medium text-white/60">{isToday ? "That's the day" : formatDateLong(date)}</p>
                    <h2 className="font-display mt-1 text-[2.2rem] leading-none tracking-wide">
                      {allDone ? "Every box checked" : isToday ? "Nothing left on the clock" : `${items.length} things planned`}
                    </h2>
                    <p className="font-body mt-1.5 text-sm text-white/70">
                      {allDone
                        ? "Log your water and steps, then get to bed on time."
                        : isToday
                          ? "Tick off anything you finished below."
                          : "Tap any line for the details."}
                    </p>
                  </>
                )}
                <div className="mt-5">
                  <div className="font-label mb-1.5 flex justify-between text-sm font-semibold text-white/60">
                    <span>Day progress</span>
                    <span className="text-white">
                      {doneCount} of {items.length}
                    </span>
                  </div>
                  <Meter value={doneCount} max={items.length} tone="bg-gold" track="bg-white/10" />
                </div>
              </div>
            </FairwayPanel>
          )}

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.06]">
            <ProteinCell hits={proteinHits} goal={proteinGoal} onChange={handleProtein} />
            <KitchenCell closed={kitchenClosed} onChange={handleKitchen} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.06]">
            <WaterCell oz={waterOz} goal={waterGoal} onChange={handleWater} />
            <SleepCell hours={sleepHours} goal={sleepGoal} onChange={handleSleep} />
            <EntryCell
              label="Steps"
              display={steps !== null ? steps.toLocaleString() : null}
              unit=""
              sub={
                steps !== null && stepGoal
                  ? steps >= stepGoal
                    ? "Goal hit"
                    : `${(stepGoal - steps).toLocaleString()} to go`
                  : stepGoal
                    ? `Goal ${stepGoal.toLocaleString()}`
                    : null
              }
              subTone={steps !== null && stepGoal && steps >= stepGoal ? "text-brand" : "text-neutral-500"}
              placeholder="8400"
              inputMode="numeric"
              onSave={async (n) => {
                await logFitSteps(userId, Math.round(n));
                setSteps(Math.round(n));
              }}
            />
            <EntryCell
              label="Weight"
              display={lastWeight ? `${lastWeight.lbs}` : null}
              unit="lbs"
              sub={weighedToday ? "Weighed in today" : "Tap to weigh in"}
              subTone={weighedToday ? "text-brand" : "text-neutral-500"}
              placeholder="219.4"
              inputMode="decimal"
              onSave={async (n) => {
                await logFitBodyWeight(userId, n);
                setLastWeight({ lbs: n, on: todayISO() });
              }}
            />
          </div>

          {block && <FitBlockPanel userId={userId} block={block} date={date} />}

          {isToday && block && <FitStreaksPanel userId={userId} sessionsPerWeek={block.sessionsPerWeek} refreshKey={streakKey} />}

          <button
            type="button"
            onClick={handleCopyForMiyagi}
            disabled={copyState === "working"}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-black/[0.06] active:bg-neutral-50 disabled:opacity-60"
          >
            <span className="bg-brand-dark text-gold flex h-10 w-10 flex-none items-center justify-center rounded-xl">
              <ClipboardIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-label block text-[1.05rem] leading-tight font-semibold">
                {copyState === "copied" ? "Copied. Paste it to Miyagi" : copyState === "working" ? "Building summary…" : "Copy today for Miyagi"}
              </span>
              <span className="font-body block text-sm text-neutral-500">Lift, steps, water, sleep, weight and what's left</span>
            </span>
          </button>
          {copyFallback && (
            <div className="mt-2 rounded-2xl bg-white p-3 ring-1 ring-black/[0.06]">
              <p className="font-label mb-1 text-sm font-semibold text-neutral-600">Couldn't copy automatically. Press and hold to copy:</p>
              <textarea readOnly value={copyFallback} rows={8} className="font-body w-full rounded-lg bg-neutral-50 p-2 text-sm" />
            </div>
          )}

          {items.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white p-5 text-center ring-1 ring-black/[0.06]">
              <p className="font-label text-lg font-semibold">Nothing scheduled</p>
              <p className="font-body text-sm text-neutral-500">This day has no plan items.</p>
            </div>
          ) : (
            PARTS.map((part) => {
              const partItems = items.filter((i) => part.test(i.timeOfDay));
              if (partItems.length === 0) return null;
              const partDone = partItems.filter(isDone).length;
              return (
                <section key={part.id} className="mt-6">
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <h2 className="font-label text-xl font-semibold text-neutral-900">{part.label}</h2>
                    <span className="font-label text-sm font-semibold text-neutral-400">
                      {partDone}/{partItems.length}
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
                    {partItems.map((item) => (
                      <PlanRow
                        key={item.id}
                        item={item}
                        checked={isDone(item)}
                        locked={isAutoDone(item)}
                        upNext={item.id === upNext?.id}
                        action={actionFor(item)}
                        onToggle={() => handleToggle(item)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
          <Link to="/app/fit/schedule" className="font-label text-brand mt-6 block text-center text-base font-semibold">
            Edit your schedule
          </Link>
        </>
      )}
    </div>
  );
}
