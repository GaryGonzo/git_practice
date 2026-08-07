export type RequestStatus = "pending" | "in_progress" | "done" | "cancelled";
export type TaskStatus = "open" | "in_progress" | "done";
export type PreferenceCategory = "coffee" | "starbucks" | "general";

export interface Profile {
  id: string;
  display_name: string;
  avatar_emoji: string;
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
