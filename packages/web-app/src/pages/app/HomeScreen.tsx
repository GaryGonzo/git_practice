import { useEffect, useMemo, useState } from "react";
import { CATEGORY_INFO, DRILL_LIBRARY, isBetterScore, type Drill, type HandicapBand, type HandicapTier, type SkillCategory, type Spot } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { getActiveDrills, getPersonalBest, getScoreHistory, saveHandicapBand, submitScore, todayISO } from "../../lib/golfableApi";
import { buildPlan, drillFromLibrary, hitTarget, swapOptions, type Place, type PracticePlan, type SessionAnswers } from "../../lib/sessionBuilder";
import {
  badges as computeBadges,
  challengeUrl,
  drillTrend,
  loadPendingChallenge,
  practiceDates,
  savePendingChallenge,
  takeNewBadges,
  weakestArea,
  type Badge,
  type Challenge,
  type LoggedScore,
} from "../../lib/golfableInsights";
import { ConsistencyCard } from "../../components/ConsistencyCard";
import { BadgeShelf } from "../../components/practice/Insights";
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
  /** Set when this session is a friend's challenge. */
  challenge?: Challenge | null;
}

const TIER_TO_BAND: Record<HandicapTier, HandicapBand> = { scratch: "0-5", low: "6-10", mid: "11-15", high: "21+" };

const SPOT_PLACE: Record<Spot, Place> = {
  body: "home",
  floor: "home",
  swing: "garage",
  basket: "garage",
  net: "net",
  range: "range",
  green: "green",
  chip: "green",
};

const AREA_NAME: Record<SkillCategory, string> = { driver: "Driver", irons: "Irons", wedges: "Wedges", putter: "Putting" };

/** A one-drill session for a friend's challenge. */
function challengePlan(drill: Drill, band: HandicapBand): PracticePlan {
  const spot: Spot = (drill.spots ?? ["floor"])[0] as Spot;
  return {
    date: todayISO(),
    answers: { areas: [drill.category], time: 15, place: SPOT_PLACE[spot] ?? "other", extras: [], gear: "clubs_balls", aids: [], band },
    steps: [{ type: "drill", drillId: drill.id, area: drill.category, minutes: drill.minutes ?? 8, spot }],
    estimatedMinutes: drill.minutes ?? 8,
  };
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

// The handicap band is asked once. It lives on the account; this copy on
// the phone means a failed save never makes us ask again.
const BAND_KEY = "golfable.handicapBand";
const BANDS: HandicapBand[] = ["0-5", "6-10", "11-15", "16-20", "21+"];
function localBand(): HandicapBand | null {
  try {
    const v = localStorage.getItem(BAND_KEY);
    return BANDS.includes(v as HandicapBand) ? (v as HandicapBand) : null;
  } catch {
    return null;
  }
}
function rememberBand(b: HandicapBand) {
  try {
    localStorage.setItem(BAND_KEY, b);
  } catch {
    // Private mode: the account copy still works.
  }
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
  const [history, setHistory] = useState<LoggedScore[] | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(saved?.challenge ?? null);
  const [pending, setPending] = useState<Challenge | null>(loadPendingChallenge);
  const [presetAreas, setPresetAreas] = useState<SkillCategory[] | undefined>(undefined);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [band, setBand] = useState<HandicapBand | null>(profile?.handicap_band ?? localBand());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveDrills().then((rows) => {
      // Until the v2 library is loaded into the database, use the copy that
      // ships with the app so sessions still work.
      const v2 = rows.filter((d) => (d.spots ?? []).length > 0);
      setDrills(v2.length > 0 ? v2 : DRILL_LIBRARY.map(drillFromLibrary));
    });
    getScoreHistory(userId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [userId]);

  const recent = useMemo(() => {
    const cutoff = daysAgoISO(7);
    return new Set((history ?? []).filter((h) => h.date >= cutoff).map((h) => h.drill.id));
  }, [history]);

  const weeklyGoal = profile?.weekly_goal ?? 3;
  const badgeList = useMemo(() => (history && band ? computeBadges(history, band, weeklyGoal) : history ? computeBadges(history, "11-15", weeklyGoal) : null), [history, band, weeklyGoal]);
  const weak = useMemo(() => (history && band ? weakestArea(history, band, todayISO()) : null), [history, band]);

  // First look at badges on this phone: remember what's already earned so
  // only new ones get the "new badge" moment.
  useEffect(() => {
    if (badgeList && stage === "home") takeNewBadges(badgeList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeList]);

  // Finishing a session: refresh history, then show any badges just earned.
  useEffect(() => {
    if (stage !== "recap") return;
    getScoreHistory(userId).then((h) => {
      setHistory(h);
      setNewBadges(takeNewBadges(computeBadges(h, band ?? "11-15", weeklyGoal)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (profile?.handicap_band) {
      setBand(profile.handicap_band);
      rememberBand(profile.handicap_band);
    } else {
      // Answered on this phone but never reached the account (or saved
      // before the account could store it): push it up now.
      const local = localBand();
      if (local && profile) saveHandicapBand(userId, local).then(refreshProfile).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.handicap_band]);

  // Keep today's session on the device as it changes.
  useEffect(() => {
    if (plan && stage !== "home") store({ plan, results, stage, index, challenge });
  }, [plan, results, stage, index, challenge]);

  const library = useMemo(() => new Map((drills ?? []).map((d) => [d.id, d])), [drills]);
  const drillIndexes = plan ? plan.steps.flatMap((s, i) => (s.type === "drill" ? [i] : [])) : [];

  async function handleAnswers(answers: SessionAnswers, newBand: HandicapBand | null) {
    if (!drills) return;
    setStage("building");
    if (newBand) {
      setBand(newBand);
      rememberBand(newBand);
      saveHandicapBand(userId, newBand)
        .then(refreshProfile)
        .catch((e) => console.warn("Couldn't save handicap band", e));
    }
    const next = buildPlan(drills, answers, todayISO(), recent);
    // A beat for Dimples to "think" -- it reads as the plan being built.
    await new Promise((r) => setTimeout(r, 1100));
    setChallenge(null);
    setPlan(next);
    setResults({});
    setIndex(next.steps.findIndex((s) => s.type === "drill"));
    setStage("plan");
  }

  function acceptChallenge(c: Challenge) {
    const drill = (drills ?? []).find((d) => d.id === c.drillId) ?? DRILL_LIBRARY.map(drillFromLibrary).find((d) => d.id === c.drillId);
    savePendingChallenge(null);
    setPending(null);
    if (!drill) {
      setToast("That drill isn't in Golfable anymore.");
      return;
    }
    const b = band ?? TIER_TO_BAND[profile?.tier ?? "mid"];
    if (!band) setBand(b);
    const next = challengePlan(drill, b);
    setChallenge(c);
    setPlan(next);
    setResults({});
    setIndex(0);
    setStage("play");
  }

  function declineChallenge() {
    savePendingChallenge(null);
    setPending(null);
  }

  async function sendChallenge(drill: Drill, score: number) {
    const url = challengeUrl({ drillId: drill.id, score, from: profile?.first_name || "A friend" });
    const text = `I scored ${score} on ${drill.name} in Golfable. Think you can beat it?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Golfable challenge", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setToast("Challenge link copied. Send it to a friend.");
    } catch {
      // Closed the share sheet.
    }
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
    setChallenge(null);
    setNewBadges([]);
    setPresetAreas(undefined);
    setStage("home");
  }

  if (stage === "questions") {
    if (!drills) return <Loading />;
    return (
      <QuestionFlow
        library={drills}
        savedBand={band}
        initialAreas={presetAreas}
        onCancel={() => {
          setPresetAreas(undefined);
          setStage(plan ? "plan" : "home");
        }}
        onDone={handleAnswers}
      />
    );
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
          onBack={() => setStage(challenge ? "home" : "plan")}
          trend={history ? drillTrend(history.filter((h) => h.date < plan.date), drill.id) : null}
          challenge={challenge && challenge.drillId === drill.id ? challenge : null}
          onChallenge={drill.scored === false ? undefined : (score) => sendChallenge(drill, score)}
        />
      );
    }
  }

  if (plan && band && drills && stage === "recap") {
    return <Recap plan={plan} library={library} results={results} band={band} newBadges={newBadges} challenge={challenge} onDone={reset} />;
  }

  const pendingDrill = pending ? ((drills ?? []).find((d) => d.id === pending.drillId) ?? null) : null;

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <header className="pt-5">
        <p className="font-label text-base font-medium text-neutral-500">Golfable</p>
        <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-wide text-neutral-900">Practice anywhere</h1>
        <p className="font-body mt-1.5 text-sm text-neutral-500">Home, office, range or green. A few quick questions and you've got a plan.</p>
      </header>

      {pending && (
        <div className="border-gold/60 mt-5 rounded-3xl border-2 bg-white p-4">
          <div className="flex items-center gap-3">
            <Dimples pose="think" className="-my-2 h-24 w-20 flex-none" />
            <div className="min-w-0">
              <p className="font-label text-sm font-semibold text-neutral-500">Challenge from {pending.from}</p>
              <p className="font-display text-[1.8rem] leading-[0.95] tracking-wide">
                Beat {pending.score} on {pendingDrill?.name ?? "their drill"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => acceptChallenge(pending)} disabled={!drills} className="font-label bg-brand flex-1 rounded-xl px-4 py-3 text-base font-bold text-white disabled:opacity-60">
              Take the challenge
            </button>
            <button type="button" onClick={declineChallenge} className="font-label rounded-xl bg-neutral-100 px-4 py-3 text-base font-bold text-neutral-600">
              Not now
            </button>
          </div>
        </div>
      )}

      <div className="bg-brand-dark relative mt-6 overflow-hidden rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2">
          <Dimples pose="putt" onDark className="-my-2 h-36 w-28 flex-none" />
          <div>
            <p className="font-display text-[2rem] leading-none tracking-wide">Ready when you are.</p>
            <p className="font-body mt-1 text-sm text-white/70">Takes about 20 seconds to set up.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setPresetAreas(undefined);
            setStage("questions");
          }}
          disabled={!drills}
          className="font-label bg-gold text-brand-dark mt-4 w-full rounded-xl px-4 py-4 text-lg font-bold shadow-lg shadow-black/20 active:scale-[0.99] disabled:opacity-60"
        >
          {drills ? "Generate today's session" : "Loading drills…"}
        </button>
        {weak && drills && (
          <button
            type="button"
            onClick={() => {
              setPresetAreas([weak.area]);
              setStage("questions");
            }}
            className="font-label mt-2 flex w-full items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 text-left active:bg-white/15"
          >
            <span>
              <span className="block text-base font-bold">Work on {AREA_NAME[weak.area]}</span>
              <span className="font-body block text-sm text-white/70">
                {weak.reason === "misses"
                  ? `Your weakest lately: ${weak.hits} of ${weak.attempts} targets hit.`
                  : `You've practiced it least this month.`}
              </span>
            </span>
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white" style={{ backgroundColor: CATEGORY_INFO[weak.area].color }} aria-hidden="true">
              →
            </span>
          </button>
        )}
      </div>

      <ConsistencyCard dates={history ? practiceDates(history) : null} goal={weeklyGoal} noun="Practice days" totalLabel="days practiced" className="mt-4" />
      <BadgeShelf badges={badgeList} />

      {toast && (
        <div className="font-label fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Loading() {
  return <div className="font-body p-6 text-center text-neutral-400">Loading…</div>;
}
