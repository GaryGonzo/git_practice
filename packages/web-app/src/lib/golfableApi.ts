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
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekISO(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

export async function getTodaysDrill(): Promise<{ drill: Drill; maxScore: number } | null> {
  const { data: daily } = await supabase
    .from("daily_golfable")
    .select("drill_id")
    .eq("date", todayISO())
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

export async function getSessionsThisWeek(userId: string): Promise<number> {
  const { count } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("date", startOfWeekISO());
  return count ?? 0;
}

export async function getMyScoreToday(userId: string, drillId: string): Promise<number | null> {
  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("drill_id", drillId)
    .eq("date", todayISO())
    .maybeSingle();
  return data?.score ?? null;
}

export async function getLastAttemptScore(userId: string, drillId: string): Promise<number | null> {
  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("drill_id", drillId)
    .lt("date", todayISO())
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.score ?? null;
}

export async function submitScore(userId: string, drillId: string, score: number): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .upsert({ user_id: userId, drill_id: drillId, date: todayISO(), score }, { onConflict: "user_id,drill_id,date" });
  if (error) throw error;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export async function getTierLeaderboard(drillId: string, tier: HandicapTier): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("scores")
    .select("score, profiles!inner(username, tier)")
    .eq("drill_id", drillId)
    .eq("date", todayISO())
    .eq("profiles.tier", tier)
    .order("score", { ascending: false });

  if (!data) return [];
  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return { username: profile.username as string, score: row.score as number };
  });
}
