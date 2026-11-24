// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { beepPlan, buildSegments, holdInfo, positionAt, totalSeconds } from "./fitTimer.ts";

test("per-side holds: ready, then left/switch/right for each set, rest between sets", () => {
  const segs = buildSegments(2, 30, 2);
  assert.deepEqual(
    segs.map((s) => s.kind),
    ["ready", "work", "switch", "work", "rest", "work", "switch", "work"]
  );
  assert.equal(segs[1].label, "Set 1 of 2 · Left side");
  assert.equal(segs[3].label, "Set 1 of 2 · Right side");
  assert.equal(totalSeconds(segs), 5 + 30 + 5 + 30 + 30 + 30 + 5 + 30);
});

test("position walks the timeline and ends done", () => {
  const segs = buildSegments(1, 20, 1);
  assert.deepEqual(positionAt(segs, 0), { index: 0, remaining: 5, done: false });
  assert.deepEqual(positionAt(segs, 7), { index: 1, remaining: 18, done: false });
  assert.equal(positionAt(segs, 25).done, true);
});

test("beeps: 3-2-1 before every change and a finish fanfare; resuming skips past beeps", () => {
  const segs = buildSegments(1, 20, 1); // ready 5s, work 20s
  const plan = beepPlan(segs, 0);
  const at = plan.map((b) => b.at);
  for (const t of [2, 3, 4, 5, 22, 23, 24, 25]) assert.ok(at.includes(t), `missing beep at ${t}`);
  const resumed = beepPlan(segs, 10);
  assert.ok(resumed.every((b) => b.at >= -0.05));
  assert.equal(resumed.filter((b) => b.at < 11).length, 0);
});

test("timed items are recognised from their fields or their dose text", () => {
  assert.deepEqual(holdInfo({ dose: "30 sec/side" }), { seconds: 30, sides: 2 });
  assert.deepEqual(holdInfo({ dose: "45 sec" }), { seconds: 45, sides: 1 });
  assert.equal(holdInfo({ dose: "12 reps/side" }), null);
  assert.deepEqual(holdInfo({ dose: "x", holdSeconds: 20, sides: 1 }), { seconds: 20, sides: 1 });
});
