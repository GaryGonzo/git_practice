// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { consistency, weekStart } from "./fitConsistency.ts";

test("weeks start on Monday", () => {
  assert.equal(weekStart("2026-11-23"), "2026-11-23"); // Monday
  assert.equal(weekStart("2026-11-29"), "2026-11-23"); // Sunday
  assert.equal(weekStart("2026-11-22"), "2026-11-16");
});

test("this week, streak and grid", () => {
  const dates = ["2026-11-09", "2026-11-11", "2026-11-13", "2026-11-16", "2026-11-18", "2026-11-20", "2026-11-21", "2026-11-23"];
  const c = consistency(dates, "2026-11-23");
  assert.equal(c.thisWeek, 1);
  assert.equal(c.weekStreak, 2); // two full weeks before this one hit 3+
  assert.equal(c.total, 8);
  assert.equal(c.weeks.length, 4);
  assert.equal(c.weeks[3].start, "2026-11-23");
  assert.equal(c.weeks[3].days[0].count, 1);
  assert.ok(c.weeks[3].days[1].future);
  assert.equal(c.weeks[2].count, 4);
});

test("an unfinished week doesn't break the streak; a missed past week does", () => {
  assert.equal(consistency(["2026-11-16", "2026-11-17", "2026-11-18"], "2026-11-23").weekStreak, 1);
  assert.equal(consistency(["2026-11-09", "2026-11-10", "2026-11-11"], "2026-11-23").weekStreak, 0);
  assert.equal(consistency([], "2026-11-23").weekStreak, 0);
});
