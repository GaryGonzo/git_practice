import { test } from "node:test";
import assert from "node:assert/strict";
import type { Drill } from "@golfable/shared";
import {
  badges,
  beatsChallenge,
  bestWeekStreak,
  challengeUrl,
  drillTrend,
  parseChallenge,
  personalBestCount,
  practiceDates,
  weakestArea,
  type LoggedScore,
} from "./golfableInsights";

const targets = { "0-5": 8, "6-10": 7, "11-15": 6, "16-20": 5, "21+": 4 };
const drill = (id: string, category: Drill["category"], extra: Partial<Drill> = {}): Drill =>
  ({ id, name: id, category, areas: [category], scored: true, scoreDirection: "higher", bandTargets: targets, ...extra }) as unknown as Drill;

const putt = drill("mug-makes", "putter");
const iron = drill("sweet-spot", "irons");
const wedge = drill("wedge-clock", "wedges");
const driver = drill("fairway", "driver");
const reps = drill("hip-turns", "irons", { scored: false, bandTargets: undefined });

let n = 0;
const log = (d: Drill, date: string, score: number, hour = 12): LoggedScore => ({
  drill: d,
  date,
  score,
  createdAt: `${date}T${String(hour).padStart(2, "0")}:00:${String(n++ % 60).padStart(2, "0")}`,
});

test("practice days are distinct and sorted", () => {
  assert.deepEqual(practiceDates([log(putt, "2026-11-20", 5), log(iron, "2026-11-18", 5), log(iron, "2026-11-20", 6)]), ["2026-11-18", "2026-11-20"]);
});

test("best week streak counts consecutive weeks at goal", () => {
  // Weeks of Nov 2, 9, 16 hit 2 days; Nov 23 only 1.
  const dates = ["2026-11-02", "2026-11-03", "2026-11-09", "2026-11-10", "2026-11-16", "2026-11-18", "2026-11-23"];
  assert.equal(bestWeekStreak(dates, 2), 3);
  assert.equal(bestWeekStreak(["2026-11-02", "2026-11-03", "2026-11-16", "2026-11-17"], 2), 1);
});

test("trend direction respects lower-is-better drills", () => {
  const lowerDrill = drill("putts", "putter", { scoreDirection: "lower" });
  const t = drillTrend([log(lowerDrill, "2026-11-01", 34), log(lowerDrill, "2026-11-05", 31)], "putts")!;
  assert.equal(t.change, 3);
  assert.equal(t.best, 31);
});

test("weakest area is the lowest hit rate lately", () => {
  const h = [
    log(putt, "2026-11-20", 2),
    log(putt, "2026-11-21", 3),
    log(iron, "2026-11-20", 7),
    log(iron, "2026-11-21", 7),
    log(wedge, "2026-11-21", 7),
  ];
  const w = weakestArea(h, "11-15", "2026-11-23")!;
  assert.equal(w.area, "putter");
  assert.equal(w.reason, "misses");
  assert.equal(w.attempts, 2);
});

test("weakest area falls back to what you haven't practiced", () => {
  const h = [log(putt, "2026-11-20", 8), log(putt, "2026-11-21", 8), log(iron, "2026-11-21", 8), log(wedge, "2026-11-21", 8)];
  const w = weakestArea(h, "11-15", "2026-11-23")!;
  assert.equal(w.reason, "neglected");
  assert.equal(w.area, "driver");
});

test("personal bests count only improvements after the first score", () => {
  assert.equal(personalBestCount([log(putt, "2026-11-01", 5), log(putt, "2026-11-02", 4), log(putt, "2026-11-03", 6), log(putt, "2026-11-04", 7)]), 2);
});

test("badges: perfect day, all-rounder, early bird", () => {
  const day = "2026-11-21";
  const h = [log(putt, day, 7, 6), log(iron, day, 7), log(wedge, day, 7), log(driver, day, 6), log(reps, day, 1)];
  const b = Object.fromEntries(badges(h, "11-15", 3).map((x) => [x.id, x.earned]));
  assert.equal(b.first, true);
  assert.equal(b.perfect, true);
  assert.equal(b["all-rounder"], true);
  assert.equal(b.early, true);
  assert.equal(b.late, false);
  assert.equal(b["days-10"], false);
});

test("challenge links round-trip and reject junk", () => {
  const url = challengeUrl({ drillId: "fairway-finder", score: 7, from: "Gary" });
  const c = parseChallenge(new URL(url).search)!;
  assert.deepEqual(c, { drillId: "fairway-finder", score: 7, from: "Gary" });
  assert.equal(parseChallenge("?d=../../x&s=3"), null);
  assert.equal(parseChallenge("?d=ok&s=abc"), null);
  assert.equal(parseChallenge("?d=ok&s=4&n=<b>hi</b>")!.from, "bhib");
  assert.equal(beatsChallenge(putt, 8, 7), true);
  assert.equal(beatsChallenge(putt, 7, 7), false);
});
