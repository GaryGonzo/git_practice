import { useState } from "react";
import type { Drill, HandicapBand, SkillCategory } from "@golfable/shared";
import { BAND_LABEL, CATEGORY_INFO } from "@golfable/shared";
import { DrillScene } from "../DrillScene";
import { Dimples } from "../Dimples";
import { CategoryIcon } from "../CategoryIcon";
import { ChevronLeft, ChevronRight } from "../ui";
import { PLACE_OPTIONS, TIME_OPTIONS, targetFor, type PracticePlan, type SessionStep } from "../../lib/sessionBuilder";
import { beatsChallenge, type Challenge, type Trend } from "../../lib/golfableInsights";
import { Sparkline } from "./Insights";
import type { Pose } from "@golfable/shared";

export interface StepResult {
  /** Score for scored drills, 1 for rep drills. Absent when skipped. */
  score?: number;
  skipped?: boolean;
  hitTarget?: boolean;
  personalBest?: boolean;
}

const AREA_LABEL: Record<SkillCategory | "warmup", string> = {
  warmup: "Warm-up",
  driver: "Driver",
  irons: "Irons",
  wedges: "Wedges",
  putter: "Putting",
};

function areaColor(area: SkillCategory | "warmup"): string {
  return area === "warmup" ? "#6b6b6b" : CATEGORY_INFO[area].color;
}

function AreaBadge({ area }: { area: SkillCategory | "warmup" }) {
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white" style={{ backgroundColor: areaColor(area) }}>
      {area === "warmup" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M12 4a8 8 0 1 1-7.4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <CategoryIcon category={area} className="h-5 w-5" />
      )}
    </span>
  );
}

function WalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="13" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 21l2-6-2.5-2.5L12 8l3 3h3M10 9l-3 3M13 15l3 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function planSummary(plan: PracticePlan): string {
  const place = PLACE_OPTIONS.find((p) => p.value === plan.answers.place)?.label ?? "";
  const time = TIME_OPTIONS.find((t) => t.value === plan.answers.time)?.label ?? "";
  return `${time} · ${place}`;
}

// ---------------------------------------------------------------------------
// Plan preview

export function PlanView({
  plan,
  library,
  results,
  onStart,
  onOpen,
  onRestart,
}: {
  plan: PracticePlan;
  library: Map<string, Drill>;
  results: Record<number, StepResult>;
  onStart: () => void;
  onOpen: (index: number) => void;
  onRestart: () => void;
}) {
  const drillSteps = plan.steps.filter((s) => s.type === "drill").length;
  const done = Object.values(results).filter((r) => r.score !== undefined || r.skipped).length;
  const started = done > 0;

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <header className="pt-5">
        <p className="font-label text-base font-medium text-neutral-500">Golfable</p>
        <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-wide text-neutral-900">Today's session</h1>
      </header>

      <div className="bg-brand-dark mt-4 flex items-center gap-3 overflow-hidden rounded-2xl py-3 pr-4 pl-2 text-white">
        <Dimples pose="think" onDark className="h-20 w-16 flex-none" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none">
            {drillSteps} drills · ~{plan.estimatedMinutes} min
          </p>
          <p className="font-body mt-1 truncate text-sm text-white/70">{planSummary(plan)}</p>
        </div>
        {started && (
          <p className="font-display text-gold flex-none text-2xl">
            {done}/{drillSteps}
          </p>
        )}
      </div>

      <ol className="mt-4 space-y-2">
        {plan.steps.map((step, i) => {
          if (step.type === "move") {
            return (
              <li key={i} className="font-label flex items-center gap-2 px-2 py-1 text-sm font-semibold text-neutral-500">
                <WalkIcon className="h-4 w-4" />
                {step.label}
              </li>
            );
          }
          const d = library.get(step.drillId);
          if (!d) return null;
          const r = results[i];
          const finished = r?.score !== undefined || r?.skipped;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onOpen(i)}
                className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 ring-black/[0.06] active:bg-neutral-50 ${finished ? "opacity-60" : ""}`}
              >
                <AreaBadge area={step.area} />
                <span className="min-w-0 flex-1">
                  <span className="font-label block text-sm font-semibold text-neutral-500">
                    {AREA_LABEL[step.area]} · ~{step.minutes} min · {d.scored === false ? "Reps" : "Scored"}
                  </span>
                  <span className={`font-label block text-[1.1rem] leading-tight font-semibold text-neutral-900 ${finished ? "line-through" : ""}`}>{d.name}</span>
                </span>
                {r?.score !== undefined ? (
                  <span className="font-label text-brand flex-none text-sm font-bold">{d.scored === false ? "Done" : r.score}</span>
                ) : r?.skipped ? (
                  <span className="font-label flex-none text-sm font-bold text-neutral-400">Skipped</span>
                ) : (
                  <ChevronRight className="h-4 w-4 flex-none text-neutral-300" />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onStart}
        className="font-label bg-brand mt-5 w-full rounded-xl px-4 py-4 text-lg font-bold text-white shadow-lg shadow-black/10 active:scale-[0.99]"
      >
        {started ? "Keep going" : "Start session"}
      </button>
      <button type="button" onClick={onRestart} className="font-label mt-2 w-full py-2 text-sm font-semibold text-neutral-500">
        Start over with new answers
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One step of the session

export function MoveStep({ step, onContinue, onBack }: { step: Extract<SessionStep, { type: "move" }>; onContinue: () => void; onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col px-4 pt-4 pb-28">
      <button type="button" onClick={onBack} className="font-label -ml-1 flex items-center gap-0.5 self-start text-base font-semibold text-neutral-500">
        <ChevronLeft className="h-4 w-4" />
        Plan
      </button>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Dimples pose="putt" className="h-48 w-40" />
        <h1 className="font-display mt-4 text-[2.4rem] leading-none tracking-wide">{step.label}</h1>
        <p className="font-body mt-2 text-sm text-neutral-500">Tap Continue when you're there.</p>
      </div>
      <button type="button" onClick={onContinue} className="font-label bg-brand w-full rounded-xl px-4 py-4 text-lg font-bold text-white">
        Continue
      </button>
    </div>
  );
}

function Stepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  const btn = "font-display flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-neutral-100 text-3xl text-neutral-700 active:bg-neutral-200";
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Less" className={btn} onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
        className="font-display h-14 min-w-0 flex-1 rounded-xl border border-neutral-300 text-center text-4xl"
        aria-label="Your score"
      />
      <button type="button" aria-label="More" className={btn} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function DrillStep({
  drill,
  step,
  index,
  total,
  band,
  result,
  saving,
  error,
  canSwap,
  onLog,
  onSkip,
  onSwap,
  onNext,
  onBack,
  trend = null,
  challenge = null,
  onChallenge,
}: {
  drill: Drill;
  step: Extract<SessionStep, { type: "drill" }>;
  index: number;
  total: number;
  band: HandicapBand;
  result: StepResult | undefined;
  saving: boolean;
  error: string | null;
  canSwap: boolean;
  onLog: (score: number) => void;
  onSkip: () => void;
  onSwap: () => void;
  onNext: () => void;
  onBack: () => void;
  /** Your scores on this drill before today, oldest first. */
  trend?: Trend | null;
  /** A friend's score to beat on this drill. */
  challenge?: Challenge | null;
  /** Send this score to a friend as a challenge. */
  onChallenge?: (score: number) => void;
}) {
  const target = targetFor(drill, band);
  const max = drill.scored === false ? 1 : (drill.bandTargets ? Math.max(...Object.values(drill.bandTargets)) * 3 : 99);
  const [value, setValue] = useState<number>(target?.value ?? 0);
  const logged = result?.score !== undefined;
  const onGreenWithCarpetDrill = step.spot === "green" && (drill.spots ?? []).includes("floor");
  const scored = drill.scored !== false;
  const beat = logged && challenge && scored ? beatsChallenge(drill, result!.score!, challenge.score) : null;

  // Dimples reacts to how it went.
  let reaction: { pose: Pose; line: string } | null = null;
  if (logged) {
    if (!scored) reaction = { pose: "celebrate", line: "Checked off. Nice." };
    else if (result!.personalBest) reaction = { pose: "dance", line: "New personal best!" };
    else if (beat) reaction = { pose: "celebrate", line: `You beat ${challenge!.from}!` };
    else if (beat === false) reaction = { pose: "shrug", line: `${challenge!.from} still leads.${result!.hitTarget ? " Target hit, though." : " Run it back?"}` };
    else if (result!.hitTarget) reaction = { pose: "celebrate", line: "Target hit." };
    else reaction = { pose: "shrug", line: "Not this time. Logged, keep at it." };
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-28">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="font-label -ml-1 flex items-center gap-0.5 text-base font-semibold text-neutral-500">
          <ChevronLeft className="h-4 w-4" />
          Plan
        </button>
        <p className="font-label text-sm font-semibold text-neutral-500">
          Drill {index} of {total}
        </p>
      </div>

      {drill.scene && <DrillScene key={drill.id} scene={drill.scene} className="mt-3" />}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="font-label rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: areaColor(step.area) }}>
          {AREA_LABEL[step.area]}
        </span>
        <span className="font-label rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-700">~{drill.minutes ?? step.minutes} min</span>
        <span className="font-label rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-700">
          {drill.scored === false ? "Reps" : "Scored"}
        </span>
      </div>
      <h1 className="font-display mt-2 text-[2.5rem] leading-[0.95] tracking-wide text-neutral-900">{drill.name}</h1>
      <p className="font-body mt-1.5 text-sm text-neutral-600">
        <span className="font-semibold text-neutral-800">You need: </span>
        {drill.setup.equipment.join(", ")}
      </p>

      <ol className="mt-4 space-y-2.5">
        {(drill.steps ?? [drill.setup.description, drill.rules.description]).map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display bg-brand/10 text-brand flex h-7 w-7 flex-none items-center justify-center rounded-full text-lg">{i + 1}</span>
            <p className="font-body pt-0.5 text-[15px] leading-snug text-neutral-800">{s}</p>
          </li>
        ))}
      </ol>
      {onGreenWithCarpetDrill && (
        <p className="font-body bg-gold/10 mt-3 rounded-lg px-3 py-2 text-sm text-neutral-700">On a real green, use a hole instead of the mug, and tees instead of coins.</p>
      )}

      {challenge && scored && (
        <div className="bg-brand-dark mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-white">
          <span className="font-display text-gold text-4xl leading-none">{challenge.score}</span>
          <p className="font-body text-sm leading-snug text-white/85">
            <span className="font-semibold text-white">{challenge.from}'s score to beat.</span> {drill.scoreDirection === "lower" ? "Go lower." : "Go higher."}
          </p>
        </div>
      )}

      {trend && scored && !logged && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.06]">
          <div>
            <p className="font-label text-sm font-semibold text-neutral-500">{trend.scores.length === 1 ? "Last time" : `Your last ${trend.scores.length}`}</p>
            <p className="font-body text-sm text-neutral-700">
              Best <span className="font-semibold text-neutral-900">{trend.best}</span>
              {trend.scores.length > 1 && trend.change !== 0 && (
                <span className={trend.change > 0 ? "text-brand" : "text-neutral-500"}> · {trend.change > 0 ? "trending up" : "trending down"}</span>
              )}
            </p>
          </div>
          {trend.scores.length > 1 ? <Sparkline trend={trend} lower={drill.scoreDirection === "lower"} /> : <span className="font-display text-3xl">{trend.last}</span>}
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
        {reaction && (
          <div className="-mt-1 mb-2 flex items-center gap-3">
            <Dimples key={reaction.pose} pose={reaction.pose} className="h-24 w-20 flex-none" />
            <p className={`font-display text-[1.7rem] leading-[0.95] tracking-wide ${reaction.pose === "shrug" ? "text-neutral-700" : "text-brand"}`}>{reaction.line}</p>
          </div>
        )}
        {drill.scored === false ? (
          <>
            <p className="font-label text-sm font-semibold text-neutral-500">Do</p>
            <p className="font-display text-3xl">{drill.repsLabel ?? "Your reps"}</p>
            {logged ? null : (
              <button
                type="button"
                disabled={saving}
                onClick={() => onLog(1)}
                className="font-label bg-brand mt-3 w-full rounded-xl px-4 py-3.5 text-lg font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Done"}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-label text-sm font-semibold text-neutral-500">{drill.scoreLabel ?? "Your score"}</p>
              {target && (
                <p className="font-label text-sm font-semibold text-neutral-500">
                  Target at {BAND_LABEL[band]}: <span className="text-neutral-900">{target.text}</span>
                </p>
              )}
            </div>
            {logged ? (
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-display text-5xl leading-none">{result!.score}</p>
                {onChallenge && (
                  <button
                    type="button"
                    onClick={() => onChallenge(result!.score!)}
                    className="font-label bg-gold/20 text-brand-dark rounded-full px-3.5 py-2 text-sm font-bold active:bg-gold/30"
                  >
                    {beat === false ? "Challenge back" : "Challenge a friend"}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mt-2">
                  <Stepper value={value} onChange={setValue} max={max} />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onLog(value)}
                  className="font-label bg-brand mt-3 w-full rounded-xl px-4 py-3.5 text-lg font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Log score"}
                </button>
              </>
            )}
          </>
        )}
        {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {logged ? (
        <button type="button" onClick={onNext} className="font-label bg-brand-dark mt-4 w-full rounded-xl px-4 py-4 text-lg font-bold text-white">
          {index === total ? "Finish session" : "Next drill"}
        </button>
      ) : (
        <div className="mt-3 flex justify-center gap-6">
          {canSwap && (
            <button type="button" onClick={onSwap} className="font-label text-sm font-semibold text-neutral-500 underline">
              Swap this drill
            </button>
          )}
          <button type="button" onClick={onSkip} className="font-label text-sm font-semibold text-neutral-500 underline">
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
