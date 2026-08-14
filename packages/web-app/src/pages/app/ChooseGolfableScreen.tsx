import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, SKILL_CATEGORIES, type Drill, type SkillCategory } from "@golfable/shared";
import { getAllDrills } from "../../lib/golfableApi";

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

export function ChooseGolfableScreen() {
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [drills, setDrills] = useState<{ drill: Drill; maxScore: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllDrills(category === "all" ? undefined : category).then((result) => {
      setDrills(result);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Choose Your Own</h1>
      <p className="font-body text-sm text-neutral-500">
        Build your own program -- pick any drill in the library and it counts just like today's Golfable.
      </p>

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
            <Link
              key={drill.id}
              to={`/app/play/${drill.id}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 active:bg-neutral-50"
            >
              <div
                className={`font-display flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm text-white ${CATEGORY_BG[drill.category]}`}
              >
                {CATEGORY_INFO[drill.category].badge}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label truncate text-sm font-semibold">{drill.name}</p>
                <p className="font-body truncate text-xs text-neutral-500">{CATEGORY_INFO[drill.category].label}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
