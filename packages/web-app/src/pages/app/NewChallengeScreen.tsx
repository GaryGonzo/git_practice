import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORY_INFO, SKILL_CATEGORIES, type Drill, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { createChallenge, getAllDrills } from "../../lib/golfableApi";
import { CategoryIcon } from "../../components/CategoryIcon";

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

export function NewChallengeScreen() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [drills, setDrills] = useState<{ drill: Drill; maxScore: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);
  const [wager, setWager] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAllDrills(category === "all" ? undefined : category).then((result) => {
      setDrills(result);
      setLoading(false);
    });
  }, [category]);

  if (!profile) return null;

  async function handleCreate() {
    if (!selectedDrillId) return;
    setError(null);
    setCreating(true);
    try {
      const { id } = await createChallenge(
        profile!.id,
        selectedDrillId,
        wager.trim() || null,
        note.trim() || null
      );
      navigate(`/app/challenges/${id}`);
    } catch {
      setError("Couldn't create that challenge -- try again.");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/challenges" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">New Challenge</h1>
      <p className="font-body text-sm text-neutral-500">Pick a drill to compete on.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`font-label rounded-full border px-3 py-1.5 text-sm font-semibold ${
            category === "all" ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
          }`}
        >
          All
        </button>
        {SKILL_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`font-label rounded-full border px-3 py-1.5 text-sm font-semibold ${
              category === c ? "bg-brand border-brand text-white" : "border-neutral-300 text-neutral-600"
            }`}
          >
            {CATEGORY_INFO[c].label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="font-body text-sm text-neutral-500">Loading…</p>
        ) : drills.length === 0 ? (
          <p className="font-body text-sm text-neutral-500">No drills in this category yet.</p>
        ) : (
          drills.map(({ drill }) => (
            <button
              key={drill.id}
              type="button"
              onClick={() => setSelectedDrillId(drill.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left ${
                selectedDrillId === drill.id ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[drill.category]}`}
              >
                <CategoryIcon category={drill.category} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label truncate text-sm font-semibold">{drill.name}</p>
                <p className="font-body truncate text-xs text-neutral-500">{CATEGORY_INFO[drill.category].label}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedDrillId && (
        <div className="mt-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
          <div>
            <label className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
              Wager <span className="font-body normal-case text-neutral-400">(optional, just for fun -- no real money)</span>
            </label>
            <input
              type="text"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              placeholder="Loser buys the next round"
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
              Note <span className="font-body normal-case text-neutral-400">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bring your A-game"
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {error && <p className="font-body mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!selectedDrillId || creating}
        className="font-label bg-brand mt-6 w-full rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {creating ? "Creating…" : "Create Challenge"}
      </button>
    </div>
  );
}
