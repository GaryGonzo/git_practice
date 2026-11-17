import { test } from "node:test";
import assert from "node:assert/strict";
import { exerciseHelp, normalizeExerciseName, youtubeSearchUrl } from "./exerciseVideos.ts";

// Every exercise name in the 16-week program (Phases 1-4), as stored.
const PROGRAM = [
  "90/90 Breathing", "Band Anti-Rotation Walkout", "Band Face Pull", "Band Lateral Walk", "Banded Clamshell",
  "Barbell Hip Thrust", "Barbell RDL", "Bench Press", "Bird Dog", "Box Squat (parallel)", "Cat-Cow", "Dead Bug",
  "Dead Bug (legs extended)", "Farmer Carry", "Glute Bridge", "Half-Kneeling Band Chop", "Half-Kneeling Band Lift",
  "Half-Kneeling Landmine Press", "Half-Kneeling Pallof Press", "High Box Squat", "Inverted Row", "Landmine Rotation",
  "Low Step-Up (8-12 in box)", "McGill Curl-Up", "Med-Ball Rotational Throw", "Med-Ball Step-Behind Throw",
  "Modified Side Plank (knees)", "Practice Swings", "Pull-Up", "Push-Up on Handles", "Quadruped T-Spine Rotation",
  "Short-Lever Copenhagen Plank", "Side Plank (feet)", "Side-Lying Hip Abduction", "Single-Leg Balance (eyes closed)",
  "Single-Leg Glute Bridge", "Single-Leg RDL", "Split Squat", "Split-Stance Band Chop", "Split-Stance Pallof Press-Out",
  "Standing Pallof Press-Out", "Suitcase Carry", "Supported Single-Leg Balance", "Supported Split Squat (short range)",
  "Tall-Kneeling Pallof Hold",
];

test("every program exercise has a video or a written walkthrough", () => {
  for (const name of PROGRAM) {
    const help = exerciseHelp(name);
    assert.ok(help && (help.youtubeId || help.explain), `missing help for ${name}`);
    if (help.youtubeId) assert.match(help.youtubeId, /^[\w-]{11}$/, name);
  }
});

test("names normalize and unknown exercises fall back to a YouTube search", () => {
  assert.equal(normalizeExerciseName("Box Squat (parallel)"), "box squat");
  assert.equal(exerciseHelp("Zercher Squat"), null);
  assert.ok(youtubeSearchUrl("Zercher Squat").startsWith("https://www.youtube.com/results?search_query=zercher%20squat"));
});
