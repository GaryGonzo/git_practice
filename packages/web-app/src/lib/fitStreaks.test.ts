// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { trainingStreak, yogaPlannedDays, sessionsDone } from "./fitStreaks";

const DAILY = [0, 1, 2, 3, 4, 5, 6];

test("yoga planned days start on the day yoga was added", () => {
  assert.deepEqual(yogaPlannedDays(DAILY, "2026-10-26", "2026-10-28"), ["2026-10-26", "2026-10-27", "2026-10-28"]);
  assert.deepEqual(yogaPlannedDays(DAILY, null, "2026-10-28"), []);
  assert.deepEqual(yogaPlannedDays([1], "2026-10-26", "2026-11-02"), ["2026-10-26", "2026-11-02"]);
});

test("yoga days extend the streak; one miss is forgiven, two in a row end it", () => {
  const today = "2026-10-31";
  const planned = yogaPlannedDays(DAILY, "2026-10-26", today);
  // Yoga Mon, Tue, (miss Wed), Thu, Fri -> 4 sessions, not on thin ice.
  const s = trainingStreak(planned, ["2026-10-26", "2026-10-27", "2026-10-29", "2026-10-30"], today);
  assert.equal(s.sessions, 4);
  assert.equal(s.onThinIce, false);
  // Miss Thu and Fri -> streak ends at the two misses.
  const broken = trainingStreak(planned, ["2026-10-26", "2026-10-27", "2026-10-28"], today);
  assert.equal(broken.sessions, 0);
});

test("missing yesterday's yoga puts the streak on thin ice", () => {
  const today = "2026-10-29";
  const s = trainingStreak(yogaPlannedDays(DAILY, "2026-10-26", today), ["2026-10-26", "2026-10-27"], today);
  assert.equal(s.sessions, 2);
  assert.equal(s.onThinIce, true);
});

test("sessions done = lifts + distinct yoga days", () => {
  assert.equal(sessionsDone(["2026-10-27", "2026-10-29"], ["2026-10-27", "2026-10-27", "2026-10-28"]), 4);
  assert.equal(sessionsDone([], []), 0);
});
