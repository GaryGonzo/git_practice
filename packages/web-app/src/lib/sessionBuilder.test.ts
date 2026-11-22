// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { DRILL_LIBRARY } from "@golfable/shared";
import { buildPlan, drillFromLibrary, extraOptions, relevantAids, needsGearQuestion, type SessionAnswers } from "./sessionBuilder.ts";

const LIB = DRILL_LIBRARY.map(drillFromLibrary);
const byId = new Map(LIB.map((d) => [d.id, d]));

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function base(over: Partial<SessionAnswers>): SessionAnswers {
  return { areas: ["irons"], time: 30, place: "range", extras: [], gear: "clubs_balls", aids: [], band: "11-15", ...over };
}

function drills(plan: ReturnType<typeof buildPlan>) {
  return plan.steps.filter((s) => s.type === "drill").map((s) => (s.type === "drill" ? byId.get(s.drillId)! : null)!);
}

test("range + irons + putting with a green: range first, one walk, then putting on the green", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const plan = buildPlan(LIB, base({ areas: ["irons", "putter"], extras: ["green"], time: 45 }), "2026-11-21", new Set(), seeded(seed));
    const moves = plan.steps.filter((s) => s.type === "move");
    assert.equal(moves.length, 1, `seed ${seed}: ${JSON.stringify(moves)}`);
    assert.equal(moves[0].type === "move" && moves[0].to, "green");
    const moveAt = plan.steps.indexOf(moves[0]);
    for (const [i, s] of plan.steps.entries()) {
      if (s.type !== "drill") continue;
      if (s.spot === "green" || s.spot === "floor") assert.ok(i > moveAt, "putting happened before the walk");
      if (s.spot === "range") assert.ok(i < moveAt, "range drill after the walk");
    }
  }
});

test("range + putting with no green: putting becomes rehearsal, never green drills", () => {
  const plan = buildPlan(LIB, base({ areas: ["putter"], extras: [] }), "2026-11-21", new Set(), seeded(3));
  const ds = drills(plan);
  assert.ok(ds.length > 0);
  assert.ok(ds.every((d) => !d.spots!.includes("green") || d.spots!.includes("body") || d.spots!.includes("swing")));
  assert.ok(plan.steps.every((s) => s.type !== "move"));
});

test("home with just a putter and a ball: carpet putting only, nothing needing clubs or a range", () => {
  const plan = buildPlan(LIB, base({ place: "home", gear: "putter_ball", areas: ["putter"], time: 15 }), "2026-11-21", new Set(), seeded(5));
  for (const d of drills(plan)) {
    assert.ok(d.spots!.some((s) => s === "floor" || s === "body"), d.id);
    assert.ok(d.needs === "none" || d.needs === "putter_ball", d.id);
  }
});

test("home with nothing, working on driver: body drills only", () => {
  const plan = buildPlan(LIB, base({ place: "home", gear: "none", areas: ["driver"], time: 15 }), "2026-11-21", new Set(), seeded(8));
  const ds = drills(plan);
  assert.ok(ds.length >= 2);
  assert.ok(ds.every((d) => d.spots!.includes("body")));
});

test("plans land near the time asked for, with no repeats", () => {
  const places = ["home", "garage", "net", "range", "green", "other"] as const;
  for (const place of places) {
    for (const time of [15, 30, 45, 60] as const) {
      for (let seed = 1; seed <= 10; seed++) {
        const plan = buildPlan(
          LIB,
          base({ place, time, areas: ["driver", "irons", "wedges", "putter"], gear: "clubs_balls", extras: ["green", "chip", "range"] }),
          "2026-11-21",
          new Set(),
          seeded(seed)
        );
        const ids = drills(plan).map((d) => d.id);
        assert.equal(new Set(ids).size, ids.length, `${place} ${time}: repeat`);
        assert.ok(plan.estimatedMinutes <= time + 8, `${place} ${time}: ${plan.estimatedMinutes} min`);
        assert.ok(plan.estimatedMinutes >= Math.min(time - 15, 10), `${place} ${time}: only ${plan.estimatedMinutes} min`);
      }
    }
  }
});

test("every area picked gets at least one drill", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const plan = buildPlan(LIB, base({ place: "garage", gear: "clubs", areas: ["driver", "wedges", "putter"], time: 15 }), "2026-11-21", new Set(), seeded(seed));
    for (const a of ["driver", "wedges", "putter"] as const) {
      assert.ok(plan.steps.some((s) => s.type === "drill" && s.area === a), `seed ${seed} missing ${a}`);
    }
  }
});

test("advanced drills only for 0-10 handicaps; aid drills only with the aid", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const hi = buildPlan(LIB, base({ areas: ["irons"], band: "21+", time: 60 }), "x", new Set(), seeded(seed));
    assert.ok(drills(hi).every((d) => d.level !== "advanced"));
    assert.ok(drills(hi).every((d) => (d.aids ?? []).length === 0));
  }
});

test("follow-up and gear questions only appear when they matter", () => {
  assert.deepEqual(extraOptions("range", ["irons"]), []);
  assert.deepEqual(extraOptions("range", ["irons", "putter"]).map((o) => o.value), ["green"]);
  assert.deepEqual(extraOptions("green", ["putter"]), []);
  assert.deepEqual(extraOptions("green", ["putter", "driver"]).map((o) => o.value), ["range"]);
  assert.equal(needsGearQuestion("range"), false);
  assert.equal(needsGearQuestion("home"), true);
});

test("aids offered fit the place and areas", () => {
  const homePutt = relevantAids(LIB, { areas: ["putter"], place: "home", gear: "putter_ball", extras: [] });
  assert.ok(homePutt.includes("mirror") && homePutt.includes("putting_mat"));
  assert.ok(!homePutt.includes("launch_monitor"));
  const rangeIronsPutt = relevantAids(LIB, { areas: ["irons", "putter"], place: "range", gear: "clubs_balls", extras: ["green"] });
  assert.ok(rangeIronsPutt.includes("launch_monitor") && rangeIronsPutt.includes("mirror"));
  const rangeIrons = relevantAids(LIB, { areas: ["irons"], place: "range", gear: "clubs_balls", extras: [] });
  assert.ok(!rangeIrons.includes("mirror") && !rangeIrons.includes("putting_mat"));
});

test("recently played drills are pushed back", () => {
  const recent = new Set(LIB.filter((d) => d.areas!.includes("putter") && d.spots!.includes("green")).map((d) => d.id));
  const plan = buildPlan(LIB, base({ place: "green", areas: ["putter"], time: 15 }), "x", recent, seeded(2));
  const first = drills(plan).find((d) => d.kind !== "warmup")!;
  assert.ok(!recent.has(first.id) || drills(plan).every((d) => recent.has(d.id) || d.kind === "warmup"));
});
