import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CATEGORY_INFO, SKILL_CATEGORIES, type ScoreDirection, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { CategoryIcon } from "../../components/CategoryIcon";
import {
  archiveCustomDrill,
  createCustomDrill,
  decodeCustomGoal,
  getDrillById,
  getMyCustomDrills,
  suggestDrillName,
  updateCustomDrill,
  type CustomDrillInput,
} from "../../lib/golfableApi";

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const inputClass =
  "font-body focus:border-brand focus:ring-brand/20 mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-base outline-none focus:ring-4";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-label block text-base font-semibold text-neutral-900">
        {label}
        {hint && <span className="font-body ml-1.5 text-sm font-normal text-neutral-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function splitCommas(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Create or edit a member's own drill. Leaving the name blank asks the
// server to name it from the drill itself (with a plain "<Club> Drill"
// fallback). Saving lands on the play screen so it can be scored right away.
export function CustomDrillScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const { drillId } = useParams();
  const isEdit = Boolean(drillId);

  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory | null>(null);
  const [setupDescription, setSetupDescription] = useState("");
  const [equipment, setEquipment] = useState("");
  const [rulesDescription, setRulesDescription] = useState("");
  const [scoring, setScoring] = useState("");
  const [scoreDirection, setScoreDirection] = useState<ScoreDirection>("higher");
  const [maxScore, setMaxScore] = useState("");
  const [goal, setGoal] = useState("");
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState("Saving…");
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    getMyCustomDrills(userId).then((mine) =>
      setExistingNames(mine.filter(({ drill }) => drill.id !== drillId).map(({ drill }) => drill.name))
    );
  }, [userId, drillId]);

  useEffect(() => {
    if (!drillId) return;
    getDrillById(drillId).then((found) => {
      if (!found || !found.drill.isCustom) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const d = found.drill;
      setName(d.name);
      setCategory(d.category);
      setSetupDescription(d.setup.description);
      setEquipment(d.setup.equipment.join(", "));
      setRulesDescription(d.rules.description);
      setScoring(d.rules.scoring.join("\n"));
      setScoreDirection(d.scoreDirection);
      setMaxScore(String(found.maxScore));
      const g = decodeCustomGoal(d);
      setGoal(g === null ? "" : String(g));
      setLoading(false);
    });
  }, [drillId]);

  const max = Number(maxScore);
  const maxValid = Number.isInteger(max) && max >= 1 && max <= 999;
  const goalNum = goal.trim() === "" ? null : Number(goal);
  const goalValid = goalNum === null || (Number.isInteger(goalNum) && goalNum >= 0 && (!maxValid || goalNum <= max));
  const scoringLines = splitLines(scoring);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!category) return setError("Pick which club this drill is for.");
    if (!setupDescription.trim()) return setError("Add a quick setup description.");
    if (!rulesDescription.trim()) return setError("Explain how the drill is played.");
    if (scoringLines.length === 0) return setError("Add at least one scoring rule.");
    if (scoringLines.length > 12) return setError("Keep it to 12 scoring rules or fewer.");
    if (!maxValid) return setError("Max score has to be a whole number from 1 to 999.");
    if (!goalValid) return setError(`Your goal has to be a whole number from 0 to ${max}.`);

    const input: CustomDrillInput = {
      name: name.trim(),
      category,
      setupDescription,
      equipment: splitCommas(equipment).slice(0, 12),
      rulesDescription,
      scoring: scoringLines,
      maxScore: max,
      scoreDirection,
      goal: goalNum,
    };

    setSaving(true);
    try {
      if (!input.name) {
        setSavingLabel("Naming your drill…");
        input.name = await suggestDrillName(session!.access_token, input, existingNames);
      }
      setSavingLabel("Saving…");
      const id = isEdit ? (await updateCustomDrill(drillId!, input), drillId!) : await createCustomDrill(userId, input);
      navigate(`/app/play/${id}`, { replace: true });
    } catch {
      setError("Couldn't save that drill -- check your connection and try again.");
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!drillId) return;
    setSaving(true);
    try {
      await archiveCustomDrill(drillId);
      navigate("/app/library", { replace: true });
    } catch {
      setError("Couldn't remove that drill -- try again.");
      setSaving(false);
    }
  }

  const backTo = isEdit ? `/app/play/${drillId}` : "/app/library";

  if (loading) return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">Couldn't find that drill.</p>
        <Link to="/app/library" className="font-label text-brand mt-2 inline-block font-semibold underline">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-md px-4 pt-4 pb-28">
      <Link to={backTo} className="font-label inline-flex items-center gap-0.5 text-base font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        {isEdit ? "Drill" : "Library"}
      </Link>

      <h1 className="font-display mt-2 text-[2.4rem] leading-none tracking-wide">{isEdit ? "Edit Your Drill" : "Build Your Own"}</h1>
      <p className="font-body text-sm text-neutral-500">
        Any drill you want. Log a score and it counts toward your week, with your history tracked like every other Golfable.
      </p>

      <div className="mt-5 space-y-5">
        <Field label="Name" hint="optional">
          <input
            type="text"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave blank and we'll name it for you"
            className={inputClass}
          />
        </Field>

        <Field label="Club">
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {SKILL_CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 ring-1 ${
                    active ? "bg-brand-dark text-white ring-transparent" : "bg-white text-neutral-600 ring-black/[0.06]"
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${CATEGORY_BG[c]}`}>
                    <CategoryIcon category={c} className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-label text-[0.8rem] leading-none font-semibold">{CATEGORY_INFO[c].label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Setup">
          <textarea
            value={setupDescription}
            maxLength={1000}
            rows={3}
            onChange={(e) => setSetupDescription(e.target.value)}
            placeholder="e.g. Pick a flag 50 yards out. 10 balls."
            className={inputClass}
          />
        </Field>

        <Field label="Equipment" hint="optional, comma separated">
          <input
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="e.g. Sand wedge, 10 balls, alignment stick"
            className={inputClass}
          />
        </Field>

        <Field label="How to play">
          <textarea
            value={rulesDescription}
            maxLength={1500}
            rows={3}
            onChange={(e) => setRulesDescription(e.target.value)}
            placeholder="e.g. Hit all 10 balls at the flag, full pre-shot routine on each."
            className={inputClass}
          />
        </Field>

        <Field label="How it's scored" hint="one rule per line">
          <textarea
            value={scoring}
            rows={4}
            onChange={(e) => setScoring(e.target.value)}
            placeholder={"Inside 10 feet: 2 points\nOn the green: 1 point\nMissed green: 0 points"}
            className={inputClass}
          />
        </Field>

        <Field label="Which score wins?">
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {(
              [
                { value: "higher", label: "Higher is better", sub: "Points, makes, hits" },
                { value: "lower", label: "Lower is better", sub: "Strokes, putts, misses" },
              ] as const
            ).map((opt) => {
              const active = scoreDirection === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScoreDirection(opt.value)}
                  aria-pressed={active}
                  className={`rounded-xl px-3 py-2.5 text-left ring-1 ${
                    active ? "bg-brand-dark text-white ring-transparent" : "bg-white text-neutral-700 ring-black/[0.06]"
                  }`}
                >
                  <span className="font-label block text-base font-semibold">{opt.label}</span>
                  <span className={`font-body block text-xs ${active ? "text-white/70" : "text-neutral-500"}`}>{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={scoreDirection === "higher" ? "Max score" : "Highest you'd log"}>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder={scoreDirection === "higher" ? "e.g. 20" : "e.g. 40"}
              className={inputClass}
            />
          </Field>
          <Field label="Your goal" hint="optional">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={maxValid ? max : 999}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={scoreDirection === "higher" ? "e.g. 14" : "e.g. 30"}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="font-body -mt-3 text-xs text-neutral-500">
          {scoreDirection === "higher"
            ? "Scores are logged from 0 up to the max. Hit your goal or better and it counts as a target hit."
            : "Scores are logged from 0 up to this number. Hit your goal or fewer and it counts as a target hit."}
        </p>
      </div>

      {error && <p className="font-body mt-5 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="font-label bg-brand mt-6 w-full rounded-xl px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
      >
        {saving ? savingLabel : isEdit ? "Save changes" : "Save and play"}
      </button>

      {isEdit &&
        (confirmRemove ? (
          <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
            <p className="font-body text-sm text-neutral-700">
              Remove this drill from your Library? Scores you've already logged on it stay in your history.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className="font-label flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-60"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="font-label flex-1 rounded-xl bg-neutral-100 px-4 py-2.5 text-base font-semibold text-neutral-700"
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="font-label mt-4 w-full text-center text-base font-semibold text-red-600"
          >
            Remove drill
          </button>
        ))}
    </form>
  );
}
