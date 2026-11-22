import { useEffect, useMemo, useState } from "react";
import { DRILL_LIBRARY, isBetterScore, type Drill, type HandicapBand } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { getActiveDrills, getPersonalBest, getScoreHistory, saveHandicapBand, submitScore, todayISO } from "../../lib/golfableApi";
import { buildPlan, drillFromLibrary, hitTarget, swapOptions, type PracticePlan, type SessionAnswers } from "../../lib/sessionBuilder";
import { Dimples } from "../../components/Dimples";
import { QuestionFlow } from "../../components/practice/QuestionFlow";
import { DrillStep, MoveStep, PlanView, type StepResult } from "../../components/practice/SessionViews";
import { Recap } from "../../components/practice/Recap";

// Golfable home: one button, a few quick questions, a practice plan you can
// do anywhere. Today's session lives on this device so leaving the app (or
// walking to the putting green) never loses your place.

type Stage = "home" | "questions" | "building" | "plan" | "play" | "recap";

interface SavedSession {
  plan: PracticePlan;
  results: Record<number, StepResult>;
  stage: Stage;
  index: number;
}

const KEY = "golfable-v2-session";

function load(): SavedSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as SavedSession | null;
    return s && s.plan?.date === todayISO() ? s : null;
  } catch {
    return null;
  }
}

function store(s: SavedSession | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: the session still works for this visit.
  }
}

function daysAgoISO(days: number): string {
  const d = new Date(`${todayISO()}T12:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function HomeScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const userId = session!.user.id;
  const saved = useMemo(load, []);
  const [stage, setStage] = useState<Stage>(saved ? (saved.stage === "building" || saved.stage === "questions" ? "plan" : saved.stage) : "home");
  const [plan, setPlan] = useState<PracticePlan | null>(saved?.plan ?? null);
  const [results, setResults] = useState<Record<number, StepResult>>(saved?.results ?? {});
  const [index, setIndex] = useState(saved?.index ?? 0);
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const [band, setBand] = useState<HandicapBand | null>(profile?.handicap_band ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveDrills().then((rows) => {
      // Until the v2 library is loaded into the database, use the copy that
      // ships with the app so sessions still work.
      const v2 = rows.filter((d) => (d.spots ?? []).length > 0);
      setDrills(v2.length > 0 ? v2 : DRILL_LIBRARY.map(drillFromLibrary));
    });
    getScoreHistory(userId).then((history) => {
      const cutoff = daysAgoISO(7);
      setRecent(new Set(history.filter((h) => h.date >= cutoff).map((h) => h.drill.id)));
    });
  }, [userId]);

  useEffect(() => {
    if (profile?.handicap_band) setBand(profile.handicap_band);
  }, [profile?.handicap_band]);

  // Keep today's session on the device as it changes.
  useEffect(() => {
    if (plan && stage !== "home") store({ plan, results, stage, index });
  }, [plan, results, stage, index]);

  const library = useMemo(() => new Map((drills ?? []).map((d) => [d.id, d])), [drills]);
  const drillIndexes = plan ? plan.steps.flatMap((s, i) => (s.type === "drill" ? [i] : [])) : [];

  async function handleAnswers(answers: SessionAnswers, newBand: HandicapBand | null) {
    if (!drills) return;
    setStage("building");
    if (newBand) {
      setBand(newBand);
      saveHandicapBand(userId, newBand)
        .then(refreshProfile)
        .catch(() => {});
    }
    const next = buildPlan(drills, answers, todayISO(), recent);
    // A beat for Dimples to "think" -- it reads as the plan being built.
    await new Promise((r) => setTimeout(r, 1100));
    setPlan(next);
    setResults({});
    setIndex(next.steps.findIndex((s) => s.type === "drill"));
    setStage("plan");
  }

  function advance() {
    if (!plan) return;
    setError(null);
    if (index + 1 >= plan.steps.length) {
      setStage("recap");
      return;
    }
    setIndex(index + 1);
    window.scrollTo({ top: 0 });
  }

  async function logScore(score: number) {
    if (!plan || !band) return;
    const step = plan.steps[index];
    if (step.type !== "drill") return;
    const drill = library.get(step.drillId);
    if (!drill) return;
    setSaving(true);
    setError(null);
    try {
      const previous = drill.scored === false ? null : await getPersonalBest(userId, drill.id, drill.scoreDirection);
      await submitScore(userId, drill.id, score, todayISO());
      setResults((r) => ({
        ...r,
        [index]: {
          score,
          hitTarget: hitTarget(drill, band, score),
          personalBest: previous !== null && isBetterScore(score, previous, drill.scoreDirection),
        },
      }));
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    setResults((r) => ({ ...r, [index]: { skipped: true } }));
    advance();
  }

  function swap() {
    if (!plan || !drills) return;
    const options = swapOptions(drills, plan, index);
    if (options.length === 0) return;
    const pick = options[Math.floor(Math.random() * options.length)];
    const steps = plan.steps.map((s, i) => (i === index && s.type === "drill" ? { ...s, drillId: pick.id, minutes: pick.minutes ?? s.minutes } : s));
    setPlan({ ...plan, steps });
  }

  function reset() {
    store(null);
    setPlan(null);
    setResults({});
    setIndex(0);
    setStage("home");
  }

  if (stage === "questions") {
    if (!drills) return <Loading />;
    return <QuestionFlow library={drills} savedBand={band} onCancel={() => setStage(plan ? "plan" : "home")} onDone={handleAnswers} />;
  }

  if (stage === "building") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <Dimples pose="think" className="h-52 w-44" />
        <p className="font-display mt-4 text-3xl tracking-wide">Building your session…</p>
      </div>
    );
  }

  if (plan && band && drills && stage === "plan") {
    return (
      <PlanView
        plan={plan}
        library={library}
        results={results}
        onOpen={(i) => {
          setIndex(i);
          setStage("play");
        }}
        onStart={() => {
          const firstOpen = plan.steps.findIndex((s, i) => s.type === "drill" && results[i] === undefined);
          setIndex(firstOpen === -1 ? 0 : firstOpen);
          setStage(firstOpen === -1 ? "recap" : "play");
        }}
        onRestart={() => setStage("questions")}
      />
    );
  }

  if (plan && band && drills && stage === "play") {
    const step = plan.steps[index];
    if (step?.type === "move") {
      return <MoveStep step={step} onContinue={advance} onBack={() => setStage("plan")} />;
    }
    const drill = step ? library.get(step.drillId) : undefined;
    if (step && drill) {
      return (
        <DrillStep
          key={`${index}-${drill.id}`}
          drill={drill}
          step={step}
          index={drillIndexes.indexOf(index) + 1}
          total={drillIndexes.length}
          band={band}
          result={results[index]}
          saving={saving}
          error={error}
          canSwap={swapOptions(drills, plan, index).length > 0}
          onLog={logScore}
          onSkip={skip}
          onSwap={swap}
          onNext={advance}
          onBack={() => setStage("plan")}
        />
      );
    }
  }

  if (plan && band && drills && stage === "recap") {
    return <Recap plan={plan} library={library} results={results} band={band} onDone={reset} />;
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <header className="pt-5">
        <p className="font-label text-base font-medium text-neutral-500">Golfable</p>
        <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-wide text-neutral-900">Practice anywhere</h1>
        <p className="font-body mt-1.5 text-sm text-neutral-500">Home, office, range or green. A few quick questions and you've got a plan.</p>
      </header>

      <div className="bg-brand-dark relative mt-6 overflow-hidden rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2">
          <Dimples pose="putt" className="-my-2 h-36 w-28 flex-none" />
          <div>
            <p className="font-display text-[2rem] leading-none tracking-wide">Ready when you are.</p>
            <p className="font-body mt-1 text-sm text-white/70">Takes about 20 seconds to set up.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStage("questions")}
          disabled={!drills}
          className="font-label bg-gold text-brand-dark mt-4 w-full rounded-xl px-4 py-4 text-lg font-bold shadow-lg shadow-black/20 active:scale-[0.99] disabled:opacity-60"
        >
          {drills ? "Generate today's session" : "Loading drills…"}
        </button>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="font-body p-6 text-center text-neutral-400">Loading…</div>;
}
