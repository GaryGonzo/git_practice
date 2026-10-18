import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO, SKILL_CATEGORIES, type Drill, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { CategoryIcon } from "../../components/CategoryIcon";
import { PageHeader, Section, Panel, ChevronRight } from "../../components/ui";
import {
  getAllDrills,
  getAllDrillRatingSummaries,
  getMyDrillRatings,
  getMyGameRatings,
  getRoundCategorySignals,
  blendGameRatings,
  type DrillRatingSummary,
} from "../../lib/golfableApi";

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

const FAVORITE_THRESHOLD = 4;

type FavoriteFilter = "all" | "mine" | "community" | "recommended";

const FAVORITE_FILTERS: { value: FavoriteFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "recommended", label: "For you" },
  { value: "mine", label: "My favorites" },
  { value: "community", label: "Top rated" },
];

// The category (or categories, if tied) where "My Game" is rated lowest --
// the weakest part of the player's own read on their game.
function weakestCategories(ratings: Partial<Record<SkillCategory, number>>): SkillCategory[] {
  const rated = SKILL_CATEGORIES.filter((c) => ratings[c] !== undefined);
  if (rated.length === 0) return [];
  const min = Math.min(...rated.map((c) => ratings[c]!));
  return rated.filter((c) => ratings[c] === min);
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" />
    </svg>
  );
}

// The Library is the full drill catalog -- every drill Golfable has, not
// just what's scheduled today. Picking one plays it via /app/play/:drillId,
// the same "Choose Your Own" flow Home's card links to -- Library and
// Choose Your Own used to be two different screens for the same idea, so
// this is just the one of them that stuck around. Your play history and
// what's coming up live on Progress instead.
export function LibraryScreen() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>("all");
  const [drills, setDrills] = useState<{ drill: Drill; maxScore: number }[]>([]);
  const [ratingSummaries, setRatingSummaries] = useState<Record<string, DrillRatingSummary>>({});
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [gameRatings, setGameRatings] = useState<Partial<Record<SkillCategory, number>>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Load the whole catalog once; club, list and search filters all run on
  // the client so switching between them is instant.
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllDrills(undefined),
      getAllDrillRatingSummaries(),
      profile ? getMyDrillRatings(profile.id) : Promise.resolve({}),
      profile ? getMyGameRatings(profile.id) : Promise.resolve({}),
      profile ? getRoundCategorySignals(profile.id) : Promise.resolve({}),
    ]).then(([drillResult, summaries, mine, game, roundSignals]) => {
      setDrills(drillResult);
      setRatingSummaries(summaries);
      setMyRatings(mine);
      setGameRatings(blendGameRatings(game, roundSignals));
      setLoading(false);
    });
  }, [profile]);

  const recommendedCategories = weakestCategories(gameRatings);

  const q = query.trim().toLowerCase();
  const visibleDrills = drills.filter(({ drill }) => {
    if (category !== "all" && drill.category !== category) return false;
    if (q && !`${drill.name} ${drill.setup.description} ${CATEGORY_INFO[drill.category].label}`.toLowerCase().includes(q)) return false;
    if (favoriteFilter === "mine") return (myRatings[drill.id] ?? 0) >= FAVORITE_THRESHOLD;
    if (favoriteFilter === "community") return (ratingSummaries[drill.id]?.avgRating ?? 0) >= FAVORITE_THRESHOLD;
    if (favoriteFilter === "recommended") return recommendedCategories.includes(drill.category);
    return true;
  });

  const emptyMessage = q ? (
    `No drills match "${query.trim()}".`
  ) : favoriteFilter === "mine" ? (
    "Rate a Golfable 4 or 5 stars after playing it and it shows up here."
  ) : favoriteFilter === "community" ? (
    "Not enough ratings yet. Check back soon."
  ) : favoriteFilter === "recommended" && recommendedCategories.length === 0 ? (
    <>
      Rate your game on{" "}
      <Link to="/app/profile" className="text-brand font-semibold underline">
        your profile
      </Link>{" "}
      or track a few{" "}
      <Link to="/app/round" className="text-brand font-semibold underline">
        rounds
      </Link>{" "}
      to get picks for the weakest part of your game.
    </>
  ) : (
    "No drills here yet."
  );

  // With no club picked and no search, group by club so 70+ drills read as
  // four short lists instead of one long one.
  const grouped = category === "all" && !q;
  const groups = grouped
    ? SKILL_CATEGORIES.map((c) => ({ category: c, items: visibleDrills.filter(({ drill }) => drill.category === c) })).filter((g) => g.items.length > 0)
    : [{ category: null as SkillCategory | null, items: visibleDrills }];

  function drillRow(drill: Drill) {
    const summary = ratingSummaries[drill.id];
    return (
      <Link key={drill.id} to={`/app/play/${drill.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-neutral-50">
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-white ${CATEGORY_BG[drill.category]}`}>
          <CategoryIcon category={drill.category} className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-label block truncate text-[1.05rem] leading-tight font-semibold text-neutral-900">{drill.name}</span>
          <span className="font-body block truncate text-sm text-neutral-500">{drill.setup.description}</span>
        </span>
        {summary && (
          <span className="text-gold flex flex-none items-center gap-0.5" aria-label={`Rated ${summary.avgRating} of 5`}>
            <StarIcon className="h-4 w-4" />
            <span className="font-label text-sm font-bold">{summary.avgRating}</span>
          </span>
        )}
        <ChevronRight className="h-4 w-4 flex-none text-neutral-300" />
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <PageHeader title="Library" sub={`${drills.length || "Every"} drills. Any one counts toward your week.`} />

      <div className="relative mt-4">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drills"
          aria-label="Search drills"
          className="font-body focus:ring-brand/20 focus:border-brand w-full rounded-xl border border-black/[0.08] bg-white py-3 pr-4 pl-11 text-base outline-none focus:ring-4"
        />
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {(["all", ...SKILL_CATEGORIES] as const).map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ring-1 ${
                active ? "bg-brand-dark text-white ring-transparent" : "bg-white text-neutral-600 ring-black/[0.06]"
              }`}
            >
              {c === "all" ? (
                <span className={`font-display flex h-7 w-7 items-center justify-center text-lg ${active ? "text-gold" : "text-neutral-400"}`}>All</span>
              ) : (
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${CATEGORY_BG[c]}`}>
                  <CategoryIcon category={c} className="h-3.5 w-3.5" />
                </span>
              )}
              <span className="font-label text-[0.8rem] leading-none font-semibold">
                {c === "all" ? "Clubs" : CATEGORY_INFO[c].label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {FAVORITE_FILTERS.map((f) => {
          const active = favoriteFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFavoriteFilter(f.value)}
              aria-pressed={active}
              className={`font-label flex-none rounded-full px-3.5 py-1.5 text-[0.95rem] font-semibold ${
                active ? "bg-gold text-brand-dark" : "bg-black/[0.04] text-neutral-600"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="font-body mt-6 text-sm text-neutral-500">Loading drills…</p>
      ) : visibleDrills.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
          <p className="font-body text-sm text-neutral-600">{emptyMessage}</p>
        </div>
      ) : (
        groups.map((g) => (
          <Section
            key={g.category ?? "results"}
            className="mt-6"
            title={g.category ? CATEGORY_INFO[g.category].label : q ? `${g.items.length} result${g.items.length === 1 ? "" : "s"}` : undefined}
            action={g.category ? <span className="font-label text-sm font-semibold text-neutral-400">{g.items.length}</span> : undefined}
          >
            <Panel>{g.items.map(({ drill }) => drillRow(drill))}</Panel>
          </Section>
        ))
      )}
    </div>
  );
}
