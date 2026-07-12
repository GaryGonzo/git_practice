import type { Drill, HandicapTier } from "@golfable/shared";
import { supabase } from "./supabaseClient";

interface DrillRow {
  id: string;
  name: string;
  category: Drill["category"];
  setup_description: string;
  setup_equipment: string[];
  rules_description: string;
  rules_scoring: string[];
  target_scratch: string;
  target_low: string;
  target_mid: string;
  target_high: string;
  max_score: number;
  video_url: string | null;
}

function toDrill(row: DrillRow): Drill {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    setup: { description: row.setup_description, equipment: row.setup_equipment },
    rules: { description: row.rules_description, scoring: row.rules_scoring },
    targets: {
      scratch: row.target_scratch,
      low: row.target_low,
      mid: row.target_mid,
      high: row.target_high,
    },
    videoUrl: row.video_url ?? undefined,
  };
}

// A single daily_golfable row's drill relation can come back as an object or
// a one-item array depending on how PostgREST infers the join -- normalize it.
function oneDrillRow(value: DrillRow | DrillRow[] | null): DrillRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekISO(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export async function getDrillForDate(date: string): Promise<{ drill: Drill; maxScore: number } | null> {
  const { data: daily } = await supabase
    .from("daily_golfable")
    .select("drill_id")
    .eq("date", date)
    .single();
  if (!daily) return null;

  const { data: drillRow } = await supabase
    .from("drills")
    .select("*")
    .eq("id", daily.drill_id)
    .single<DrillRow>();
  if (!drillRow) return null;

  return { drill: toDrill(drillRow), maxScore: drillRow.max_score };
}

export async function getTodaysDrill(): Promise<{ drill: Drill; maxScore: number } | null> {
  return getDrillForDate(todayISO());
}

// Counts by when a score was logged, not which date the drill was originally
// scheduled for -- so catching up an old Golfable from the Library still
// counts toward this week's goal.
export async function getSessionsThisWeek(userId: string): Promise<number> {
  const { count } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfWeekISO());
  return count ?? 0;
}

export async function getMyScoreForDate(userId: string, drillId: string, date: string): Promise<number | null> {
  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("drill_id", drillId)
    .eq("date", date)
    .maybeSingle();
  return data?.score ?? null;
}

export async function getLastAttemptScore(
  userId: string,
  drillId: string,
  beforeDate: string
): Promise<number | null> {
  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("drill_id", drillId)
    .lt("date", beforeDate)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.score ?? null;
}

export async function submitScore(userId: string, drillId: string, score: number, date: string): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .upsert({ user_id: userId, drill_id: drillId, date, score }, { onConflict: "user_id,drill_id,date" });
  if (error) throw error;
}

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  score: number;
}

export async function getTierLeaderboard(
  drillId: string,
  tier: HandicapTier,
  date: string
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("scores")
    .select("user_id, score, profiles!inner(first_name, tier)")
    .eq("drill_id", drillId)
    .eq("date", date)
    .eq("profiles.tier", tier)
    .order("score", { ascending: false });

  if (!data) return [];
  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return { userId: row.user_id as string, firstName: profile.first_name as string, score: row.score as number };
  });
}

export interface GolfableCalendarEntry {
  date: string;
  drill: Drill;
  maxScore: number;
}

export interface PastGolfableEntry extends GolfableCalendarEntry {
  completed: boolean;
  score: number | null;
}

export async function getPastGolfables(userId: string): Promise<PastGolfableEntry[]> {
  const { data: daily } = await supabase
    .from("daily_golfable")
    .select("date, drills(*)")
    .lt("date", todayISO())
    .order("date", { ascending: false });
  if (!daily || daily.length === 0) return [];

  const dates = daily.map((row) => row.date as string);
  const { data: scores } = await supabase
    .from("scores")
    .select("date, drill_id, score")
    .eq("user_id", userId)
    .in("date", dates);

  const scoreMap = new Map<string, number>();
  (scores ?? []).forEach((s) => scoreMap.set(`${s.date}_${s.drill_id}`, s.score));

  const entries: PastGolfableEntry[] = [];
  for (const row of daily) {
    const drillRow = oneDrillRow(row.drills as DrillRow | DrillRow[] | null);
    if (!drillRow) continue;
    const date = row.date as string;
    const score = scoreMap.get(`${date}_${drillRow.id}`) ?? null;
    entries.push({
      date,
      drill: toDrill(drillRow),
      maxScore: drillRow.max_score,
      completed: score !== null,
      score,
    });
  }
  return entries;
}

export async function getUpcomingGolfables(): Promise<GolfableCalendarEntry[]> {
  const { data } = await supabase
    .from("daily_golfable")
    .select("date, drills(*)")
    .gt("date", todayISO())
    .order("date", { ascending: true });
  if (!data) return [];

  const entries: GolfableCalendarEntry[] = [];
  for (const row of data) {
    const drillRow = oneDrillRow(row.drills as DrillRow | DrillRow[] | null);
    if (!drillRow) continue;
    entries.push({ date: row.date as string, drill: toDrill(drillRow), maxScore: drillRow.max_score });
  }
  return entries;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  tier?: HandicapTier;
  weekly_goal?: number;
  has_seen_walkthrough?: boolean;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<void> {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

export interface ScoreHistoryEntry {
  date: string;
  createdAt: string;
  drill: Drill;
  maxScore: number;
  score: number;
}

export const FOUNDER_SPOTS = 100;

// head: true returns only the row count, not the rows themselves -- safe to
// call from the logged-out marketing page even though it hits the publicly
// readable profiles table.
export async function getFounderSpotsRemaining(): Promise<number> {
  const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  return Math.max(FOUNDER_SPOTS - (count ?? 0), 0);
}

export async function getScoreHistory(userId: string): Promise<ScoreHistoryEntry[]> {
  const { data } = await supabase
    .from("scores")
    .select("date, score, created_at, drills(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!data) return [];

  const entries: ScoreHistoryEntry[] = [];
  for (const row of data) {
    const drillRow = oneDrillRow(row.drills as DrillRow | DrillRow[] | null);
    if (!drillRow) continue;
    entries.push({
      date: row.date as string,
      createdAt: row.created_at as string,
      drill: toDrill(drillRow),
      maxScore: drillRow.max_score,
      score: row.score as number,
    });
  }
  return entries;
}
