import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader, FairwayPanel } from "../../components/ui";
import { nutritionPlan as plan, mealById, isLemonForward, type Mocktail, type NutritionMeal } from "../../data/nutritionPlan";
import { addDays, mondayOf, nutritionStore } from "../../lib/nutritionGoals";

// Sunday shopping/prep is for the week that starts the next day.
const planWeek = () => mondayOf(addDays(todayISO(), 1));
import { todayISO } from "../../lib/golfableApi";
import { copyText } from "../../lib/clipboard";

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "meals", label: "Meals" },
  { id: "shop", label: "Shop" },
  { id: "prep", label: "Prep" },
  { id: "drinks", label: "Mocktails" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const SLOT_LABELS = ["Breakfast", "Lunch", "Pre-lift snack", "Post-lift", "Dinner"];

function fmt12(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]}${h >= 12 ? "pm" : "am"}`;
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`w-full bg-neutral-200 object-cover ${className}`} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] ${className}`}>{children}</div>;
}

function useChecks(key: string): [Set<string>, (id: string) => void, () => void] {
  const [checks, setChecks] = useState<Set<string>>(() => new Set(nutritionStore.read<string[]>(key, [])));
  const toggle = (id: string) =>
    setChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      nutritionStore.write(key, [...next]);
      return next;
    });
  const clear = () => {
    nutritionStore.write(key, []);
    setChecks(new Set());
  };
  return [checks, toggle, clear];
}

function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex min-h-11 w-full items-start gap-3 py-2 text-left"
    >
      <span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md ring-2 ${checked ? "bg-brand ring-brand text-white" : "ring-neutral-300"}`}>
        {checked ? "✓" : ""}
      </span>
      <span className={`font-body text-[0.95rem] ${checked ? "text-neutral-400 line-through" : "text-neutral-800"}`}>{children}</span>
    </button>
  );
}

function PlanTab() {
  const t = plan.targets;
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Los_Angeles" });
  const [day, setDay] = useState(plan.week_menu[today] ? today : "Mon");
  return (
    <>
      <FairwayPanel className="mt-4">
        <div className="p-5">
          <p className="font-label text-sm font-semibold text-white/60">Daily targets · Set by Harper</p>
          <p className="font-display mt-1 text-4xl text-white">
            ~{t.daily.kcal.toLocaleString()} <span className="font-label text-base text-white/60">kcal approx.</span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Protein", t.daily.protein_g],
              ["Carbs", t.daily.carbs_g],
              ["Fat", t.daily.fat_g],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/10 py-2">
                <p className="font-display text-2xl text-white">{v}g</p>
                <p className="font-label text-xs font-semibold text-white/60">{k}</p>
              </div>
            ))}
          </div>
          <ul className="font-label mt-4 space-y-1 text-[0.95rem] font-semibold text-white/90">
            <li>💧 Water {t.water_oz} oz</li>
            <li>🥩 {t.protein_hits_per_day} protein hits a day ({t.protein_hit_g} g each)</li>
            <li>🔒 Kitchen closed {fmt12(t.kitchen_closed)}</li>
          </ul>
        </div>
      </FairwayPanel>
      <Card className="bg-gold/10">
        <p className="font-label text-sm font-bold text-neutral-800">Deload week · {t.deload.dates}</p>
        <p className="font-body text-sm text-neutral-700">
          ~{t.deload.kcal.toLocaleString()} kcal approx. {t.deload.note}.
        </p>
      </Card>
      <p className="font-body mt-2 px-1 text-xs text-neutral-500">{t.note} {t.weigh_ins}.</p>

      <Card>
        <p className="font-label text-lg font-semibold">This week's menu</p>
        <div className="mt-2 flex gap-1.5" role="tablist" aria-label="Day">
          {Object.keys(plan.week_menu).map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === day}
              onClick={() => setDay(d)}
              className={`font-label min-h-11 flex-1 rounded-full text-sm font-bold ${d === day ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600"}`}
            >
              {d}
            </button>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-neutral-100">
          {plan.week_menu[day].map((id, i) => {
            const m = mealById(id);
            return (
              <li key={i} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="font-label text-xs font-semibold text-neutral-500">{SLOT_LABELS[i] ?? ""}</p>
                  <p className="font-label text-base font-semibold text-neutral-900">
                    {m?.name ?? id}
                    {/leftovers/.test(id) && <span className="text-neutral-500"> (leftovers)</span>}
                  </p>
                </div>
                {m && <p className="font-label shrink-0 text-sm text-neutral-500">~{m.kcal} kcal · {m.protein_g}g P</p>}
              </li>
            );
          })}
        </ul>
        <p className="font-body mt-1 text-xs text-neutral-500">Weekends: same targets, flexible meals. Approx. {plan.daily_totals_approx}.</p>
      </Card>

      <Card>
        <p className="font-label text-lg font-semibold">Daily schedule</p>
        <ul className="mt-2 space-y-1">
          {Object.entries(plan.schedule).map(([k, v]) => (
            <li key={k} className="font-body flex justify-between text-sm">
              <span className="capitalize text-neutral-700">{k.replace(/_/g, " ")}</span>
              <span className="font-semibold text-neutral-900">{v.replace(/^(\d{1,2}:\d{2})/, (s) => fmt12(s)).replace(/(\d{1,2}:\d{2})\)/, (_s, x) => `${fmt12(x)})`)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function MealDetail({ meal, onClose }: { meal: NutritionMeal; onClose: () => void }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
      <Photo src={meal.photo} alt={`${meal.name} (illustration)`} className="aspect-[4/3]" />
      <div className="p-4">
        <button type="button" onClick={onClose} className="font-label text-brand -ml-1 min-h-11 text-base font-semibold">
          ‹ All meals
        </button>
        <h2 className="font-display text-3xl leading-tight">{meal.name}</h2>
        <p className="font-label text-sm font-semibold text-neutral-500">
          {meal.slot} · {meal.days.join(", ")} · ~{meal.kcal} kcal approx. · {meal.protein_g} g protein
          {meal.servings ? ` · makes ${meal.servings}` : ""}
        </p>
        <h3 className="font-label mt-4 text-lg font-semibold">Ingredients</h3>
        <ul className="font-body mt-1 list-disc space-y-1 pl-5 text-[0.95rem]">
          {meal.ingredients.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <h3 className="font-label mt-4 text-lg font-semibold">Steps</h3>
        <ol className="font-body mt-1 list-decimal space-y-1 pl-5 text-[0.95rem]">
          {meal.steps.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function MealsTab() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = plan.meals.find((m) => m.id === openId);
  if (open) return <MealDetail meal={open} onClose={() => setOpenId(null)} />;
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {plan.meals.map((m) => (
        <button key={m.id} type="button" onClick={() => setOpenId(m.id)} className="overflow-hidden rounded-2xl bg-white text-left ring-1 ring-black/[0.06] active:bg-neutral-50">
          <Photo src={m.photo} alt={`${m.name} (illustration)`} className="aspect-[4/3]" />
          <div className="p-3">
            <p className="font-label text-[0.95rem] leading-tight font-semibold">{m.name}</p>
            <p className="font-label mt-0.5 text-xs font-semibold text-neutral-500">
              ~{m.kcal} kcal · {m.protein_g}g P
            </p>
            <p className="font-label text-xs text-neutral-400">{m.days.join(" ")}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ShopTab() {
  const week = planWeek();
  const [checks, toggle, clear] = useChecks(`shop.${week}`);
  const [copied, setCopied] = useState(false);
  const sections = Object.entries(plan.shopping_list.sections);
  const total = sections.reduce((n, [, items]) => n + items.length, 0);

  async function copyList() {
    const text = [
      `Shopping list - ${plan.shopping_list.store}`,
      ...sections.flatMap(([s, items]) => ["", s.toUpperCase(), ...items.filter((i) => !checks.has(`${s}|${i}`)).map((i) => `- ${i}`)]),
    ].join("\n");
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <>
      <Card>
        <p className="font-label text-sm font-semibold text-neutral-500">{plan.shopping_list.store}</p>
        <p className="font-label text-lg font-semibold">
          {checks.size}/{total} in the cart
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={copyList} className="font-label bg-brand-dark text-gold min-h-11 flex-1 rounded-full text-sm font-bold">
            {copied ? "Copied ✓" : "Copy list"}
          </button>
          <button type="button" onClick={clear} className="font-label min-h-11 rounded-full px-4 text-sm font-bold text-neutral-600 ring-1 ring-black/10">
            Reset
          </button>
        </div>
      </Card>
      {sections.map(([section, items]) => (
        <Card key={section}>
          <p className="font-label text-base font-bold text-neutral-900">{section}</p>
          <div className="mt-1 divide-y divide-neutral-100">
            {items.map((item) => (
              <CheckRow key={item} checked={checks.has(`${section}|${item}`)} onToggle={() => toggle(`${section}|${item}`)}>
                {item}
              </CheckRow>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <p className="font-label text-base font-bold">Already on hand</p>
        <p className="font-body mt-1 text-sm text-neutral-600">{plan.shopping_list.on_hand.join(" · ")}</p>
      </Card>
    </>
  );
}

function PrepTab() {
  const week = planWeek();
  // Stored as indexes so the weekly goal can tell when every step is done.
  const [checks, toggle, clear] = useChecks(`prepRaw.${week}`);
  const steps = plan.prep_day.steps;
  function onToggle(i: number) {
    toggle(String(i));
    const next = new Set(checks);
    if (next.has(String(i))) next.delete(String(i));
    else next.add(String(i));
    nutritionStore.write(`prep.${week}`, [...next].map(Number));
  }
  return (
    <Card>
      <p className="font-label text-sm font-semibold text-neutral-500">
        {plan.prep_day.day} · ~{plan.prep_day.hands_on_min} min hands-on
      </p>
      <p className="font-label text-lg font-semibold">
        Sunday prep · {checks.size}/{steps.length}
      </p>
      <div className="mt-1 divide-y divide-neutral-100">
        {steps.map((s, i) => (
          <CheckRow key={i} checked={checks.has(String(i))} onToggle={() => onToggle(i)}>
            {s.replace(/^\d+\.\s*/, "")}
          </CheckRow>
        ))}
      </div>
      {checks.size === steps.length && <p className="font-label text-brand mt-2 text-base font-bold">Prep done. That's the week built. 🧱</p>}
      <button
        type="button"
        onClick={() => {
          clear();
          nutritionStore.write(`prep.${week}`, []);
        }}
        className="font-label mt-2 min-h-11 text-sm font-semibold text-neutral-500"
      >
        Reset checklist
      </button>
    </Card>
  );
}

function MocktailDetail({ m, fav, onFav }: { m: Mocktail; fav: boolean; onFav: () => void }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
      <Photo src={m.photo} alt={`${m.name} (illustration)`} className="aspect-square max-h-80" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-3xl leading-tight">{m.name}</h2>
          <button
            type="button"
            onClick={onFav}
            aria-pressed={fav}
            aria-label={fav ? "Remove from favorites" : "Save as favorite"}
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-2xl ring-1 ring-black/10"
          >
            {fav ? "★" : "☆"}
          </button>
        </div>
        <p className="font-label text-sm font-semibold text-neutral-500">~{m.kcal_approx} kcal approx.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.tags.map((t) => (
            <span key={t} className="font-label rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
              {t}
            </span>
          ))}
        </div>
        <h3 className="font-label mt-4 text-lg font-semibold">Ingredients</h3>
        <ul className="font-body mt-1 list-disc space-y-1 pl-5 text-[0.95rem]">
          {m.ingredients.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <h3 className="font-label mt-4 text-lg font-semibold">Steps</h3>
        <ol className="font-body mt-1 list-decimal space-y-1 pl-5 text-[0.95rem]">
          {m.steps.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const FILTER_TAGS = ["citrus", "bubbly", "herbal", "spicy", "smoky", "fruity", "low-sugar", "whiskey-style"];

function MocktailsTab() {
  const recipes = plan.mocktails.recipes;
  const [tag, setTag] = useState<string | null>(null);
  const [noLemon, setNoLemon] = useState(() => nutritionStore.read<boolean>("noLemon", false));
  const [favs, setFavs] = useState<string[]>(() => nutritionStore.read<string[]>("favMocktails", []));
  const [favOnly, setFavOnly] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const pool = useMemo(
    () => recipes.filter((m) => (!tag || m.tags.includes(tag)) && (!noLemon || !isLemonForward(m)) && (!favOnly || favs.includes(m.id))),
    [recipes, tag, noLemon, favOnly, favs]
  );
  const picked = recipes.find((m) => m.id === pickedId);

  function surprise() {
    const options = pool.length > 1 ? pool.filter((m) => m.id !== pickedId) : pool;
    if (options.length === 0) return;
    setPickedId(options[Math.floor(Math.random() * options.length)].id);
  }
  function toggleFav(id: string) {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    nutritionStore.write("favMocktails", next);
  }
  const chip = (active: boolean) =>
    `font-label min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${active ? "bg-brand text-white" : "bg-white text-neutral-600 ring-1 ring-black/10"}`;

  return (
    <>
      <Card>
        <p className="font-label text-lg font-semibold">The weeknight swap</p>
        <p className="font-body text-sm text-neutral-600">Drinks stay on the one planned night. Every other night, pour one of these. All ~40 kcal or less, approx.</p>
        <button type="button" onClick={surprise} disabled={pool.length === 0} className="font-label bg-gold text-brand-dark mt-3 min-h-14 w-full rounded-full text-lg font-bold disabled:opacity-40">
          🎲 Surprise me
        </button>
      </Card>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" aria-pressed={noLemon} onClick={() => { setNoLemon(!noLemon); nutritionStore.write("noLemon", !noLemon); }} className={chip(noLemon)}>
          No lemon
        </button>
        <button type="button" aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)} className={chip(favOnly)}>
          ★ Favorites
        </button>
        {FILTER_TAGS.map((t) => (
          <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)} className={chip(tag === t)}>
            {t}
          </button>
        ))}
      </div>
      {picked && <MocktailDetail m={picked} fav={favs.includes(picked.id)} onFav={() => toggleFav(picked.id)} />}
      {pool.length === 0 ? (
        <Card className="text-center">
          <p className="font-label text-base font-semibold">No mocktails match those filters</p>
        </Card>
      ) : (
        <div className="mt-4 space-y-2">
          {pool.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPickedId(m.id)}
              className={`flex w-full items-center gap-3 rounded-2xl bg-white p-2 text-left ring-1 ${m.id === pickedId ? "ring-brand" : "ring-black/[0.06]"}`}
            >
              <img src={m.photo} alt="" loading="lazy" decoding="async" className="h-14 w-14 flex-none rounded-xl bg-neutral-200 object-cover" />
              <span className="min-w-0 flex-1">
                <span className="font-label block text-[0.95rem] leading-tight font-semibold">
                  {favs.includes(m.id) ? "★ " : ""}
                  {m.name}
                </span>
                <span className="font-label block text-xs text-neutral-500">
                  ~{m.kcal_approx} kcal · {m.tags.slice(0, 3).join(", ")}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// Harper's nutrition plan, read-only, plus the habit helpers around it.
export function FitNutritionScreen() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "plan") as TabId;
  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <Link to="/app/fit/today" className="font-label -ml-1 inline-flex min-h-11 items-center text-base font-semibold text-neutral-500">
        ‹ Today
      </Link>
      <PageHeader kicker="Golfable Fit" title="Fuel" sub="Harper's plan. You run the habits." />
      <div className="sticky top-0 z-10 -mx-4 mt-3 flex gap-1.5 overflow-x-auto bg-[#f3f5f2]/95 px-4 py-2 backdrop-blur" role="tablist" aria-label="Fuel sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            onClick={() => setParams(t.id === "plan" ? {} : { tab: t.id }, { replace: true })}
            className={`font-label min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${t.id === tab ? "bg-brand-dark text-gold" : "bg-white text-neutral-600 ring-1 ring-black/10"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "plan" && <PlanTab />}
      {tab === "meals" && <MealsTab />}
      {tab === "shop" && <ShopTab />}
      {tab === "prep" && <PrepTab />}
      {tab === "drinks" && <MocktailsTab />}
      <p className="font-body mt-6 text-center text-xs text-neutral-400">Photos are illustrations. Calories are approximate. Not medical advice.</p>
    </div>
  );
}
