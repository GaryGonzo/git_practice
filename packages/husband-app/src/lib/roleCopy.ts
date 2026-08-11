import type { HouseholdRole } from "../types";

// Centralizes the language split between roles: the husband's screens speak
// in received/passive terms (things arrive, get cashed in), the wife's speak
// in active/initiating terms (make, assign, set up) -- matching how the two
// of them actually use the app day to day.
interface RoleCopy {
  requestsButton: string;
  requestsEmptyState: string;
  tasksButton: string;
  tasksEmptyState: string;
  rewardsHeading: string;
  rewardsRedeemCta: string;
  homeRequestsCard: string;
  homeTasksCard: string;
}

const HUSBAND_COPY: RoleCopy = {
  requestsButton: "New request",
  requestsEmptyState: "No requests yet -- nice.",
  tasksButton: "New to-do",
  tasksEmptyState: "No to-do items yet.",
  rewardsHeading: "Cash in your rewards",
  rewardsRedeemCta: "Cash in",
  homeRequestsCard: "☕ You have a request",
  homeTasksCard: "✅ New to-do item",
};

const WIFE_COPY: RoleCopy = {
  requestsButton: "Make a request",
  requestsEmptyState: "Nothing sent yet -- make a request.",
  tasksButton: "Assign a new to-do item",
  tasksEmptyState: "Nothing assigned yet.",
  rewardsHeading: "Set up rewards together",
  rewardsRedeemCta: "Redeem",
  homeRequestsCard: "☕ Requests",
  homeTasksCard: "✅ Honey-do list",
};

export function getRoleCopy(role: HouseholdRole | undefined): RoleCopy {
  return role === "wife" ? WIFE_COPY : HUSBAND_COPY;
}
