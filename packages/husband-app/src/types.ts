export type RequestStatus = "pending" | "in_progress" | "done" | "cancelled" | "declined";
export type TaskStatus = "open" | "in_progress" | "done" | "declined";
export type PreferenceCategory = "coffee" | "starbucks" | "general";
export type HouseholdRole = "wife" | "husband";
export type RequestTier = "small" | "medium" | "large";
export type AskUrgency = "whenever" | "soon" | "urgent" | "emergency";
export type CustomAskKind = "request" | "task";
export type RewardStatus = "pending" | "active";
export type NotificationKind =
  | "request_created"
  | "request_started"
  | "request_done"
  | "request_declined"
  | "task_created"
  | "task_started"
  | "task_done"
  | "task_declined"
  | "bonus_points"
  | "reward_redeemed"
  | "reward_requested"
  | "reward_approved";

export interface Profile {
  id: string;
  display_name: string;
  avatar_emoji: string;
  avatar_url: string | null;
  role: HouseholdRole;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface PerkCatalogItem {
  key: string;
  label: string;
  emoji: string;
  sort_order: number;
  tier: RequestTier;
}

export interface HouseholdRequest {
  id: string;
  household_id: string;
  requested_by: string;
  assigned_to: string;
  perk_key: string | null;
  custom_label: string | null;
  note: string | null;
  status: RequestStatus;
  tier: RequestTier;
  urgency: AskUrgency;
  points: number;
  decline_note: string | null;
  created_at: string;
  completed_at: string | null;
  perk_catalog: { label: string; emoji: string } | null;
}

export interface HouseholdTask {
  id: string;
  household_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  points: number;
  status: TaskStatus;
  urgency: AskUrgency;
  decline_note: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PointsLedgerEntry {
  id: string;
  household_id: string;
  member_id: string;
  points: number;
  reason: string;
  task_id: string | null;
  created_at: string;
}

export interface Preference {
  id: string;
  household_id: string;
  member_id: string;
  category: PreferenceCategory;
  title: string;
  body: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  household_id: string;
  recipient_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  title: string;
  body: string | null;
  request_id: string | null;
  task_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: { display_name: string; avatar_emoji: string; avatar_url: string | null } | null;
}

export interface CustomAskTemplate {
  id: string;
  household_id: string;
  created_by: string;
  kind: CustomAskKind;
  label: string;
  emoji: string;
  points: number | null;
  tier: RequestTier | null;
  use_count: number;
  created_at: string;
}

export interface Reward {
  id: string;
  household_id: string;
  created_by: string;
  label: string;
  emoji: string;
  point_cost: number;
  status: RewardStatus;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  household_id: string;
  reward_id: string | null;
  redeemed_by: string;
  label: string;
  points_spent: number;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  display_name: string;
  email: string | null;
  role: HouseholdRole;
  created_at: string;
}
