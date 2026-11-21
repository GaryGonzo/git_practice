// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Drill, SkillCategory } from "@golfable/shared";
import { estimateMinutes, generateSession, SESSION_LENGTHS } from "./drillGenerator.ts";

function drill(id: string, category: SkillCategory, equipment: string[]): Drill {
  return {
    id,
    name: id,
    category,
    setup: { equipment, description: "" },
    rules: { description: "", scoring: [] },
    targets: { scratch: "", low: "", mid: "", high: "" },
    scoreDirection: "higher",
  };
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const CATS: SkillCategory[] = ["driver", "irons", "wedges", "putter"];
const LIBRARY: Drill[] = CATS.flatMap((c) =>
  Array.from({ length: 15 }, (_, i) => drill(`${c}-${i}`, c, ["Club", `${[8, 10, 15, 18, 27][i % 5]} golf balls`]))
);

test("minutes come from the ball count, with sensible fallbacks", () => {
  assert.equal(estimateMinutes(drill("a", "irons", ["7-iron", "15 golf balls"])), 13);
  assert.equal(estimateMinutes(drill("b", "putter", ["Putter", "Several golf balls"])), 12);
  assert.equal(estimateMinutes(drill("c", "putter", ["Putter", "2 golf balls (if playing solo)"])), 12);
  assert.equal(estimateMinutes(drill("d", "wedges", ["Wedge", "36 golf balls"])), 20);
});

test("sessions land near the time asked for, with no repeats", () => {
  for (const minutes of SESSION_LENGTHS) {
    for (let seed = 1; seed <= 30; seed++) {
      const s = generateSession(LIBRARY, minutes, "mix", "2026-11-21", new Set(), seeded(seed));
      assert.ok(s.drills.length >= 1);
      assert.ok(s.estimatedMinutes <= minutes + 5, `${minutes}: ${s.estimatedMinutes}`);
      assert.ok(s.estimatedMinutes >= minutes - 8, `${minutes}: ${s.estimatedMinutes}`);
      assert.equal(new Set(s.drills.map((d) => d.drillId)).size, s.drills.length);
    }
  }
});

test("mix covers every category once there's time for four drills", () => {
  const s = generateSession(LIBRARY, 60, "mix", "2026-11-21", new Set(), seeded(3));
  for (const c of CATS) assert.ok(s.drills.some((d) => d.category === c), `missing ${c}`);
});

test("a single area only uses that area", () => {
  const s = generateSession(LIBRARY, 45, "wedges", "2026-11-21", new Set(), seeded(5));
  assert.ok(s.drills.every((d) => d.category === "wedges"));
});

test("recently played drills are picked last", () => {
  const recent = new Set(LIBRARY.filter((d) => d.category === "putter").slice(0, 14).map((d) => d.id));
  const s = generateSession(LIBRARY, 15, "putter", "2026-11-21", recent, seeded(9));
  assert.equal(s.drills[0].drillId, "putter-14");
});
