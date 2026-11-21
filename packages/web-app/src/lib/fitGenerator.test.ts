// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateRoutine, DURATION_OPTIONS, GROUP_ORDER } from "./fitGenerator.ts";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test("every duration lands close to the time asked for and hits all three groups", () => {
  for (const minutes of DURATION_OPTIONS) {
    for (let seed = 1; seed <= 50; seed++) {
      const r = generateRoutine(minutes, "2026-11-21", seeded(seed));
      assert.ok(Math.abs(r.estimatedMinutes - minutes) <= 3, `${minutes} min, seed ${seed}: got ${r.estimatedMinutes}`);
      for (const g of GROUP_ORDER) assert.ok(r.items.some((i) => i.group === g), `${minutes} min missing ${g}`);
    }
  }
});

test("no exercise repeats within a routine, and it's ordered glutes, shoulders, core", () => {
  const r = generateRoutine(60, "2026-11-21", seeded(7));
  const names = r.items.map((i) => i.name);
  assert.equal(new Set(names).size, names.length);
  const order = r.items.map((i) => GROUP_ORDER.indexOf(i.group));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test("different presses give different routines", () => {
  const a = generateRoutine(30, "2026-11-21", seeded(1)).items.map((i) => i.name).join();
  const b = generateRoutine(30, "2026-11-21", seeded(2)).items.map((i) => i.name).join();
  assert.notEqual(a, b);
});
