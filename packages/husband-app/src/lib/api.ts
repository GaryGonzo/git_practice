import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type {
  AdminUserRow,
  AskUrgency,
  CustomAskKind,
  CustomAskTemplate,
  HouseholdRequest,
  HouseholdTask,
  Notification,
  PerkCatalogItem,
  PointsLedgerEntry,
  Preference,
  PreferenceCategory,
  RequestStatus,
  RequestTier,
  Reward,
  RewardCatalogItem,
  RewardRedemption,
  TaskCatalogItem,
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

export async function getTaskCatalog(): Promise<TaskCatalogItem[]> {
  const { data, error } = await supabase.from("task_catalog").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getRewardCatalog(): Promise<RewardCatalogItem[]> {
  const { data, error } = await supabase.from("reward_catalog").select("*").order("sort_order");
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
  points: number;
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
    points: input.points,
  });
  if (error) throw error;
}

// Status transitions other than "done" carry no points effect. Marking a
// request done goes through complete_request() instead, since that's the
// one transition that has to award points atomically alongside the status
// change.
export async function updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  const { error } = await supabase
    .from("requests")
    .update({ status, completed_at: null })
    .eq("id", requestId);
  if (error) throw error;
}

export async function completeRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_request", { target_request_id: requestId });
  if (error) throw error;
}

export async function updateRequestPoints(requestId: string, points: number): Promise<void> {
  const { error } = await supabase.rpc("update_request_points", { target_request_id: requestId, new_points: points });
  if (error) throw error;
}

export async function deleteRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from("requests").delete().eq("id", requestId);
  if (error) throw error;
}

export async function declineRequest(requestId: string, note?: string | null): Promise<void> {
  const { error } = await supabase.rpc("decline_request", { target_request_id: requestId, decline_reason: note ?? null });
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

export async function declineTask(taskId: string, note?: string | null): Promise<void> {
  const { error } = await supabase.rpc("decline_task", { target_task_id: taskId, note: note ?? null });
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

export interface PointsSummary {
  earned: number;
  redeemed: number;
  available: number;
}

// Splits a member's ledger into lifetime earned vs. lifetime redeemed,
// since "available" alone can't be shown as a running total on its own --
// redemptions are negative entries in the same ledger.
export function pointsSummaryForMember(entries: PointsLedgerEntry[], memberId: string): PointsSummary {
  let earned = 0;
  let redeemed = 0;
  for (const entry of entries) {
    if (entry.member_id !== memberId) continue;
    if (entry.points > 0) earned += entry.points;
    else redeemed += -entry.points;
  }
  return { earned, redeemed, available: earned - redeemed };
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

export async function listCustomAskTemplates(householdId: string, kind: CustomAskKind): Promise<CustomAskTemplate[]> {
  const { data, error } = await supabase
    .from("custom_ask_templates")
    .select("*")
    .eq("household_id", householdId)
    .eq("kind", kind)
    .order("use_count", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface SaveCustomAskTemplateInput {
  householdId: string;
  kind: CustomAskKind;
  label: string;
  emoji: string;
  points?: number | null;
  tier?: RequestTier | null;
}

export async function saveCustomAskTemplate(input: SaveCustomAskTemplateInput): Promise<void> {
  const { error } = await supabase.rpc("upsert_custom_ask_template", {
    target_household_id: input.householdId,
    target_kind: input.kind,
    target_label: input.label,
    target_emoji: input.emoji,
    target_points: input.points ?? null,
    target_tier: input.tier ?? null,
  });
  if (error) throw error;
}

export async function listRewards(householdId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("household_id", householdId)
    .order("point_cost", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface NewRewardInput {
  householdId: string;
  createdBy: string;
  label: string;
  emoji: string;
  pointCost: number;
}

export async function createReward(input: NewRewardInput): Promise<void> {
  const { error } = await supabase.from("rewards").insert({
    household_id: input.householdId,
    created_by: input.createdBy,
    label: input.label,
    emoji: input.emoji,
    point_cost: input.pointCost,
  });
  if (error) throw error;
}

export async function deleteReward(rewardId: string): Promise<void> {
  const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
  if (error) throw error;
}

export interface UpdateRewardInput {
  label: string;
  emoji: string;
  pointCost: number;
}

export async function updateReward(rewardId: string, input: UpdateRewardInput): Promise<void> {
  const { error } = await supabase
    .from("rewards")
    .update({ label: input.label, emoji: input.emoji, point_cost: input.pointCost })
    .eq("id", rewardId);
  if (error) throw error;
}

export async function redeemReward(rewardId: string): Promise<void> {
  const { error } = await supabase.rpc("redeem_reward", { target_reward_id: rewardId });
  if (error) throw error;
}

export async function approveReward(rewardId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_reward", { target_reward_id: rewardId });
  if (error) throw error;
}

export async function listRedemptions(householdId: string): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// The admin_list_users RPC is SECURITY DEFINER and checks profiles.is_admin
// on the caller server-side -- it throws for anyone who isn't flagged as an
// admin, regardless of what the client sends.
export async function listAllUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data ?? [];
}

export interface SavePushSubscriptionInput {
  memberId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function savePushSubscription(input: SavePushSubscriptionInput): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      member_id: input.memberId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}
