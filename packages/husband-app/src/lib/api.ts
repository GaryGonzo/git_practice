import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type {
  AskUrgency,
  HouseholdRequest,
  HouseholdTask,
  Notification,
  PerkCatalogItem,
  PointsLedgerEntry,
  Preference,
  PreferenceCategory,
  RequestStatus,
  RequestTier,
  TaskStatus,
} from "../types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getPerkCatalog(): Promise<PerkCatalogItem[]> {
  const { data, error } = await supabase.from("perk_catalog").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function listRequests(householdId: string): Promise<HouseholdRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*, perk_catalog(label, emoji)")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    perk_catalog: oneOrFirst(row.perk_catalog),
  })) as HouseholdRequest[];
}

export interface NewRequestInput {
  householdId: string;
  requestedBy: string;
  assignedTo: string;
  perkKey?: string | null;
  customLabel?: string | null;
  note?: string | null;
  tier: RequestTier;
  urgency: AskUrgency;
}

export async function createRequest(input: NewRequestInput): Promise<void> {
  const { error } = await supabase.from("requests").insert({
    household_id: input.householdId,
    requested_by: input.requestedBy,
    assigned_to: input.assignedTo,
    perk_key: input.perkKey ?? null,
    custom_label: input.customLabel ?? null,
    note: input.note ?? null,
    tier: input.tier,
    urgency: input.urgency,
  });
  if (error) throw error;
}

export async function updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  const { error } = await supabase
    .from("requests")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", requestId);
  if (error) throw error;
}

export async function deleteRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from("requests").delete().eq("id", requestId);
  if (error) throw error;
}

export async function listTasks(householdId: string): Promise<HouseholdTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface NewTaskInput {
  householdId: string;
  createdBy: string;
  assignedTo?: string | null;
  title: string;
  description?: string | null;
  points: number;
  urgency: AskUrgency;
}

export async function createTask(input: NewTaskInput): Promise<void> {
  const { error } = await supabase.from("tasks").insert({
    household_id: input.householdId,
    created_by: input.createdBy,
    assigned_to: input.assignedTo ?? null,
    title: input.title,
    description: input.description ?? null,
    points: input.points,
    urgency: input.urgency,
  });
  if (error) throw error;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) throw error;
}

export async function completeTask(taskId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_task", { target_task_id: taskId });
  if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function listPointsLedger(householdId: string): Promise<PointsLedgerEntry[]> {
  const { data, error } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function totalsByMember(entries: PointsLedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.member_id, (totals.get(entry.member_id) ?? 0) + entry.points);
  }
  return totals;
}

export async function awardBonusPoints(
  householdId: string,
  memberId: string,
  points: number,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc("award_bonus_points", {
    target_household_id: householdId,
    target_member_id: memberId,
    bonus_points: points,
    bonus_reason: reason,
  });
  if (error) throw error;
}

export async function listPreferences(householdId: string): Promise<Preference[]> {
  const { data, error } = await supabase
    .from("preferences")
    .select("*")
    .eq("household_id", householdId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface UpsertPreferenceInput {
  id?: string;
  householdId: string;
  memberId: string;
  category: PreferenceCategory;
  title: string;
  body: string;
}

export async function upsertPreference(input: UpsertPreferenceInput): Promise<void> {
  if (input.id) {
    const { error } = await supabase
      .from("preferences")
      .update({ category: input.category, title: input.title, body: input.body, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("preferences").insert({
    household_id: input.householdId,
    member_id: input.memberId,
    category: input.category,
    title: input.title,
    body: input.body,
  });
  if (error) throw error;
}

export async function deletePreference(id: string): Promise<void> {
  const { error } = await supabase.from("preferences").delete().eq("id", id);
  if (error) throw error;
}

// Uploads to <userId>/avatar.<ext> with upsert so a re-upload just replaces
// the existing file rather than accumulating orphaned objects, then stamps
// a cache-busting query param onto the public URL so the img tag actually
// picks up the new image instead of a stale browser-cached copy.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (updateError) throw updateError;

  return url;
}

export async function listNotifications(recipientId: string, limit = 30): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!actor_id(display_name, avatar_emoji, avatar_url)")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, actor: oneOrFirst(row.actor) })) as Notification[];
}

export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", recipientId)
    .is("read_at", null);
  if (error) throw error;
}

export function subscribeToNotifications(recipientId: string, onInsert: (n: Notification) => void): RealtimeChannel {
  return supabase
    .channel(`notifications:${recipientId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${recipientId}` },
      (payload) => onInsert(payload.new as Notification)
    )
    .subscribe();
}
