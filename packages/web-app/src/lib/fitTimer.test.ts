// Run with: npm test (node --test, type stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { beepPlan, buildSegments, holdInfo, positionAt, totalSeconds } from "./fitTimer.ts";

test("per-side holds: 3-second ready, then left/switch/right for each set, no rest", () => {
  const segs = buildSegments(2, 30, 2);
  assert.deepEqual(
    segs.map((s) => s.kind),
    ["ready", "work", "switch", "work", "work", "switch", "work"]
  );
  assert.equal(segs[0].seconds, 3);
  assert.equal(segs[1].label, "Set 1 of 2 · Left side");
  assert.equal(segs[4].label, "Set 2 of 2 · Left side");
  assert.equal(totalSeconds(segs), 3 + 30 + 5 + 30 + 30 + 5 + 30);
});

test("position walks the timeline and ends done", () => {
  const segs = buildSegments(1, 20, 1);
  assert.deepEqual(positionAt(segs, 0), { index: 0, remaining: 3, done: false });
  assert.deepEqual(positionAt(segs, 5), { index: 1, remaining: 18, done: false });
  assert.equal(positionAt(segs, 23).done, true);
});

test("beeps: 3-2-1 before every change and a finish fanfare; resuming skips past beeps", () => {
  const segs = buildSegments(1, 20, 1); // ready 3s, work 20s
  const plan = beepPlan(segs, 0);
  const at = plan.map((b) => b.at);
  for (const t of [1, 2, 3, 20, 21, 22, 23]) assert.ok(at.includes(t), `missing beep at ${t}`);
  const resumed = beepPlan(segs, 10);
  assert.ok(resumed.every((b) => b.at >= -0.05));
  // Resuming 10s in: nothing from before, and the next pip is 10s away (at 20s).
  assert.equal(Math.min(...resumed.map((b) => b.at)), 10);
});

test("timed items are recognised from their fields or their dose text", () => {
  assert.deepEqual(holdInfo({ dose: "30 sec/side" }), { seconds: 30, sides: 2 });
  assert.deepEqual(holdInfo({ dose: "45 sec" }), { seconds: 45, sides: 1 });
  assert.equal(holdInfo({ dose: "12 reps/side" }), null);
  assert.deepEqual(holdInfo({ dose: "x", holdSeconds: 20, sides: 1 }), { seconds: 20, sides: 1 });
});
