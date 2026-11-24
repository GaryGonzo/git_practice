import { useEffect, useMemo, useRef, useState } from "react";
import type { Aid, Drill, HandicapBand, SkillCategory } from "@golfable/shared";
import { AID_LABEL, BAND_LABEL, HANDICAP_BANDS, SKILL_CATEGORIES } from "@golfable/shared";
import {
  GEAR_OPTIONS,
  PLACE_OPTIONS,
  TIME_OPTIONS,
  extraOptions,
  needsGearQuestion,
  relevantAids,
  type Extra,
  type Gear,
  type Place,
  type SessionAnswers,
  type TimeBucket,
} from "../../lib/sessionBuilder";
import { ChevronLeft } from "../ui";

// A few quick questions, one per screen. Single-choice questions light up
// your pick for a beat, then move on; multi-choice ones get a Next button.
// Follow-ups only appear when they change the plan. Back is always there.

/** How long a single-choice pick stays lit before moving on. */
const PICK_HOLD_MS = 650;

/** Everything that might be at the facility, for the "what else" question. */
const EXTRAS_AT: Record<string, { value: Extra; label: string }[]> = {
  range: [
    { value: "green", label: "A practice putting green" },
    { value: "chip", label: "A chipping area or bunker" },
  ],
  green: [
    { value: "range", label: "A driving range" },
    { value: "chip", label: "A chipping area or bunker" },
  ],
};

const AREA_LABEL: Record<SkillCategory, string> = { driver: "Driver", irons: "Irons", wedges: "Wedges", putter: "Putting" };

type QuestionId = "areas" | "time" | "place" | "extras" | "gear" | "aids" | "band";

function Option({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left ring-1 transition active:scale-[0.99] ${
        selected ? "bg-brand text-white ring-brand" : "bg-white text-neutral-900 ring-black/[0.08]"
      }`}
    >
      <span>
        <span className="font-label block text-lg leading-tight font-semibold">{label}</span>
        {sub && <span className={`font-body block text-sm ${selected ? "text-white/75" : "text-neutral-500"}`}>{sub}</span>}
      </span>
      <span
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ring-2 ${selected ? "bg-white text-brand ring-white" : "ring-neutral-300"}`}
        aria-hidden="true"
      >
        {selected && (
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function QuestionFlow({
  library,
  savedBand,
  onCancel,
  onDone,
}: {
  library: Drill[];
  savedBand: HandicapBand | null;
  onCancel: () => void;
  onDone: (answers: SessionAnswers, newBand: HandicapBand | null) => void;
}) {
  const [areas, setAreas] = useState<SkillCategory[]>([]);
  const [time, setTime] = useState<TimeBucket | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [gear, setGear] = useState<Gear | null>(null);
  const [aids, setAids] = useState<(Aid | "other")[]>([]);
  const [band, setBand] = useState<HandicapBand | null>(savedBand);
  const [step, setStep] = useState(0);
  // The option just tapped on a single-choice question, while it holds.
  const [picked, setPicked] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  }, []);

  // Ask "what else is here" when it could matter; offer everything that
  // might be there and let them pick all that apply.
  const extraOpts = place && extraOptions(place, areas).length > 0 ? (EXTRAS_AT[place] ?? []) : [];
  const aidOpts = useMemo(
    () => (place ? relevantAids(library, { areas, place, gear: gear ?? "clubs_balls", extras }) : []),
    [library, areas, place, gear, extras]
  );

  // The questions that apply, given the answers so far.
  const questions: QuestionId[] = ["areas", "time", "place"];
  if (place && extraOpts.length > 0) questions.push("extras");
  if (place && needsGearQuestion(place)) questions.push("gear");
  questions.push("aids");
  if (!savedBand) questions.push("band");

  const current = questions[step];

  function finish(overrides: { band?: HandicapBand } = {}) {
    const b = overrides.band ?? band;
    if (!place || !time || !b) return;
    onDone(
      {
        areas,
        time,
        place,
        extras,
        gear: needsGearQuestion(place) ? (gear ?? "none") : "clubs_balls",
        aids: aids.filter((a): a is Aid => a !== "other"),
        band: b,
      },
      savedBand ? null : b
    );
  }

  const direction = useRef<1 | -1>(1);

  function next() {
    direction.current = 1;
    if (step + 1 >= questions.length) finish();
    else setStep(step + 1);
  }

  function back() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setPicked(null);
    direction.current = -1;
    if (step === 0) onCancel();
    else setStep(step - 1);
  }

  // Single choice: light it up, hold a beat so you can see it, then go.
  // The latest next/finish is read at the end of the hold so it sees the
  // answer just given.
  const nextRef = useRef(next);
  nextRef.current = next;
  const finishRef = useRef(finish);
  finishRef.current = finish;
  function pick(id: string, apply: () => void, then: "next" | ((f: typeof finish) => void) = "next") {
    if (picked) return;
    apply();
    setPicked(id);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setPicked(null);
      if (then === "next") nextRef.current();
      else then(finishRef.current);
    }, PICK_HOLD_MS);
  }

  // Skip the aids question when nothing here would use an aid. Runs after
  // render so it sees the aids list for the answers just given.
  useEffect(() => {
    if (current !== "aids" || aidOpts.length > 0) return;
    if (direction.current === -1) setStep((s) => s - 1);
    else if (step + 1 >= questions.length) finish();
    else setStep(step + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, aidOpts.length]);

  const allAreas = areas.length === SKILL_CATEGORIES.length;
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const progress = Math.round(((step + 1) / questions.length) * 100);

  let title = "";
  let sub = "";
  let body: React.ReactNode = null;
  let multi = false;
  let canNext = true;

  switch (current) {
    case "areas":
      title = "What do you want to work on?";
      sub = "Pick one or more.";
      multi = true;
      canNext = areas.length > 0;
      body = (
        <>
          {SKILL_CATEGORIES.map((c) => (
            <Option key={c} label={AREA_LABEL[c]} selected={areas.includes(c)} onClick={() => setAreas(toggle(areas, c))} />
          ))}
          <Option label="Mix it up" sub="A bit of everything" selected={allAreas} onClick={() => setAreas(allAreas ? [] : [...SKILL_CATEGORIES])} />
        </>
      );
      break;
    case "time":
      title = "How much time do you have?";
      body = TIME_OPTIONS.map((o) => (
        <Option
          key={o.value}
          label={o.label}
          selected={time === o.value}
          onClick={() => pick(String(o.value), () => setTime(o.value))}
        />
      ));
      break;
    case "place":
      title = "Where are you training today?";
      body = PLACE_OPTIONS.map((o) => (
        <Option
          key={o.value}
          label={o.label}
          sub={o.sub || undefined}
          selected={place === o.value}
          onClick={() =>
            pick(o.value, () => {
              setPlace(o.value);
              setExtras([]);
              setAids([]);
            })
          }
        />
      ));
      break;
    case "extras":
      title = place === "range" ? "What else is at the range?" : "What else is at the course?";
      sub = "Pick all that apply. We'll send you there for the parts that need it.";
      multi = true;
      body = (
        <>
          {extraOpts.map((o) => (
            <Option key={o.value} label={o.label} selected={extras.includes(o.value)} onClick={() => setExtras(toggle(extras, o.value))} />
          ))}
          <Option label="Nothing else" selected={extras.length === 0} onClick={() => setExtras([])} />
        </>
      );
      break;
    case "gear":
      title = "What do you have with you?";
      body = GEAR_OPTIONS.map((o) => (
        <Option
          key={o.value}
          label={o.label}
          selected={gear === o.value}
          onClick={() =>
            pick(o.value, () => {
              setGear(o.value);
              setAids([]);
            })
          }
        />
      ));
      break;
    case "aids":
      title = "Any training aids with you?";
      sub = "Pick any.";
      multi = true;
      body = (
        <>
          {aidOpts.map((a) => (
            <Option key={a} label={AID_LABEL[a]} selected={aids.includes(a)} onClick={() => setAids(toggle(aids, a))} />
          ))}
          <Option label="Other" selected={aids.includes("other")} onClick={() => setAids(toggle(aids, "other"))} />
          <Option label="None" selected={aids.length === 0} onClick={() => setAids([])} />
        </>
      );
      break;
    case "band":
      title = "What's your handicap?";
      sub = "Sets your targets. We'll remember it, and you can change it in Profile.";
      body = HANDICAP_BANDS.map((b) => (
        <Option
          key={b}
          label={BAND_LABEL[b]}
          selected={band === b}
          onClick={() => pick(b, () => setBand(b), (fin) => fin({ band: b }))}
        />
      ));
      break;
  }

  const isLast = step === questions.length - 1 || (questions[step + 1] === "aids" && aidOpts.length === 0 && step + 2 >= questions.length);
  if (current === "aids" && aidOpts.length === 0) return null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col px-4 pt-4 pb-28">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          className="font-label -ml-1 flex flex-none items-center gap-1 rounded-full bg-white py-2 pr-4 pl-3 text-base font-bold text-neutral-800 ring-1 ring-black/[0.1] active:bg-neutral-100"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 0 ? "Cancel" : "Back"}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
          <div className="bg-brand h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h1 className="font-display mt-6 text-[2.3rem] leading-[0.95] tracking-wide text-neutral-900">{title}</h1>
      {sub && <p className="font-body mt-2 text-sm text-neutral-500">{sub}</p>}

      <div key={current} className="mt-5 space-y-2.5">
        {body}
      </div>

      {multi && (
        <button
          type="button"
          onClick={next}
          disabled={!canNext}
          className="font-label bg-brand mt-6 w-full rounded-xl px-4 py-4 text-lg font-bold text-white shadow-lg shadow-black/10 disabled:opacity-40"
        >
          {isLast ? "Build my session" : "Next"}
        </button>
      )}
    </div>
  );
}
