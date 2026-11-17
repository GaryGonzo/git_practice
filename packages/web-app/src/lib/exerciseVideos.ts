// "Watch how" help for each exercise in Golfable Fit.
//
// Every exercise in Gary's 16-week program has a hand-picked YouTube
// tutorial (chosen Nov 2026). An exercise with no good video gets a fuller
// written explanation instead, shown in the app. Anything not listed here
// (older blocks, swaps) falls back to a YouTube search for its name, so the
// button always leads somewhere useful.

export interface ExerciseHelp {
  /** YouTube video id. */
  youtubeId?: string;
  /** Written walkthrough, used when there's no video. */
  explain?: { what: string; steps: string[]; avoid: string[] };
}

const HELP: Record<string, ExerciseHelp> = {
  "90/90 breathing": { youtubeId: "DKdIY5GX1As" },
  "cat-cow": { youtubeId: "M8U0mHhg0Dk" },
  "bird dog": { youtubeId: "LaLKNS7mxrk" },
  "glute bridge": { youtubeId: "CPb8yRUxWBQ" },
  "single-leg glute bridge": { youtubeId: "nat5dN0Kuao" },
  "mcgill curl-up": { youtubeId: "_tz9WGVH25g" },
  "modified side plank": { youtubeId: "lvpPNjRQONQ" },
  "side plank": { youtubeId: "0M-erHBl48U" },
  "dead bug": { youtubeId: "g_BYB0R-4Ws" },
  "side-lying hip abduction": { youtubeId: "9dJVwNzbH7s" },
  "banded clamshell": { youtubeId: "hQupQ9mJZFw" },
  "band lateral walk": { youtubeId: "qeIK3bkD-vA" },
  "quadruped t-spine rotation": { youtubeId: "IJhZNTsLf-A" },
  "barbell rdl": { youtubeId: "u87dwyD3EL0" },
  "single-leg rdl": { youtubeId: "AUVEE7idrBg" },
  "barbell hip thrust": { youtubeId: "NDlzVV-UCHE" },
  "high box squat": { youtubeId: "fVOrkHf_54k" },
  "box squat": { youtubeId: "fVOrkHf_54k" },
  "split squat": { youtubeId: "4aqrcebiFZo" },
  "supported split squat": { youtubeId: "4aqrcebiFZo" },
  "low step-up": { youtubeId: "PuDxw0dtc70" },
  "short-lever copenhagen plank": { youtubeId: "GSyjyAvhGt4" },
  "supported single-leg balance": { youtubeId: "HTVVv4ESgms" },
  "single-leg balance": { youtubeId: "cDnTke5lZPA" },
  "bench press": { youtubeId: "gRVjAtPip0Y" },
  "pull-up": { youtubeId: "rVRiy_HVz2g" },
  "inverted row": { youtubeId: "cEvMu6RYSwc" },
  "push-up on handles": { youtubeId: "OsYxYBCMp7o" },
  "band face pull": { youtubeId: "PYj77in44ms" },
  "half-kneeling landmine press": { youtubeId: "H94pwr-7iN0" },
  "half-kneeling pallof press": { youtubeId: "O3LtfPsiRy8" },
  "tall-kneeling pallof hold": { youtubeId: "K905oB4vPMY" },
  "split-stance pallof press-out": { youtubeId: "q_SgHjY4fck" },
  "standing pallof press-out": { youtubeId: "suXbr509tFQ" },
  "band anti-rotation walkout": { youtubeId: "YkhGJcEr0vk" },
  "half-kneeling band chop": { youtubeId: "knZfggvbS50" },
  "half-kneeling band lift": { youtubeId: "knZfggvbS50" },
  "split-stance band chop": { youtubeId: "F6bspnaMvGg" },
  "landmine rotation": { youtubeId: "NbQyA4pw9i4" },
  "med-ball rotational throw": { youtubeId: "-S_FklBEtsQ" },
  "med-ball step-behind throw": { youtubeId: "VdJFugfPdNs" },
  "suitcase carry": { youtubeId: "7jfXW_R4mPY" },
  "farmer carry": { youtubeId: "7PT4HVFtljk" },
  "practice swings": {
    explain: {
      what: "Slow rehearsal swings that warm the hips, upper back and shoulders in the exact pattern you're about to load -- and check how the low back feels before any speed.",
      steps: [
        "Take your normal address with a mid-iron. Try the lead (left) foot flared out 20-30 degrees.",
        "Swing 1-2 at about 30% speed, pausing 1 second at the top. Feel the turn come from the hips and chest together.",
        "Swings 3-5 build to about 50%. Let the lead hip clear -- don't force it to rotate.",
        "Hold every finish for 3 seconds, balanced on the lead leg, belt buckle at the target.",
        "Note the back: 0-2/10 is a green light for the session. Anything sharp or pinching means skip the rotation and throws today.",
      ],
      avoid: [
        "Speed. This is a rehearsal, not a hit.",
        "Twisting from the low back while the hips stay square.",
        "Finishing off-balance -- if you can't hold the finish, slow down.",
      ],
    },
  },
};

/** Lower-case, drop "(knees)"-style notes and extra spaces. */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function exerciseHelp(name: string): ExerciseHelp | null {
  return HELP[normalizeExerciseName(name)] ?? null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${normalizeExerciseName(name)} exercise how to proper form`)}`;
}
