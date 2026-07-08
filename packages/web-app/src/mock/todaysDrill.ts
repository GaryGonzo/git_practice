import type { Drill, HandicapTier } from "@golfable/shared";

export const MOCK_USER = {
  username: "gpgolfs",
  tier: "mid" as HandicapTier,
  weeklyGoal: 4,
  sessionsThisWeek: 3,
};

export const TODAYS_DRILL: Drill = {
  id: "the-clock",
  name: "The Clock",
  category: "wedges",
  setup: {
    equipment: ["Sand wedge", "8 golf balls", "Distance markers at 20, 40, 60, and 80 yards"],
    description:
      "Set up four target zones at 20, 40, 60, and 80 yards, arranged like numbers on a clock face. Hit two balls to each distance, working around the clock.",
  },
  rules: {
    description:
      "Play each distance in order, two balls per distance. A ball counts as a make if it finishes inside a 6-foot circle around the target.",
    scoring: [
      "1 point per ball inside 6 feet",
      "Bonus point for any ball inside 3 feet",
      "8 balls total across the 4 distances",
    ],
  },
  targets: {
    scratch: "7/8",
    low: "5/8",
    mid: "4/8",
    high: "2/8",
  },
};

export const LAST_ATTEMPT_SCORE = 3;

// Other Mid-tier golfers who already logged today's Golfable. The current
// user's own score gets inserted into this list once they submit.
export const LEADERBOARD_MID_TIER_OTHERS = [
  { username: "shanks4days", score: 8 },
  { username: "birdiehunter", score: 7 },
  { username: "duffer_dave", score: 4 },
  { username: "yips_no_more", score: 3 },
  { username: "fairway_frank", score: 2 },
];
