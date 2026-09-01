import type { BagClub, BagEntry, Drill, HandicapTier, ScoreDirection, SkillCategory } from "@golfable/shared";
import { BAG_CLUBS, SKILL_CATEGORIES } from "@golfable/shared";
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
  score_direction: ScoreDirection;
  video_url: string | null;
  target_yardage: number | null;
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
    scoreDirection: row.score_direction,
    videoUrl: row.video_url ?? undefined,
    targetYardage: row.target_yardage ?? undefined,
  };
}

// A single daily_golfable row's drill relation can come back as an object or
// a one-item array depending on how PostgREST infers the join -- normalize it.
function oneDrillRow(value: DrillRow | DrillRow[] | null): DrillRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// The daily Golfable flips over -- and "this week" resets -- at Pacific
// midnight for every user, regardless of where they're actually playing
// from, so the whole platform shares one definition of "today."
const GOLFABLE_TZ = "America/Los_Angeles";

// en-CA formats as YYYY-MM-DD, which is exactly the wall-clock date in the
// target zone -- no manual offset math needed.
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GOLFABLE_TZ }).format(new Date());
}

// Reads the current Pacific wall-clock date/time by formatting `now` into
// that zone, then constructs a Date whose UTC fields equal those wall-clock
// values -- a standard trick for doing zone-aware date arithmetic (like
// "roll back to Monday") without a timezone library.
function pacificWallClockAsUTC(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GOLFABLE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return new Date(
    Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"))
  );
}

function startOfWeekISO(): string {
  const now = new Date();
  const wallClock = pacificWallClockAsUTC(now);
  const offsetMs = now.getTime() - wallClock.getTime();

  const day = wallClock.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(wallClock);
  monday.setUTCDate(wallClock.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  // monday is Pacific-midnight-Monday expressed with UTC fields -- add back
  // the real UTC offset to get the actual instant that moment occurred.
  return new Date(monday.getTime() + offsetMs).toISOString();
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

// Unlike getDrillForDate, this isn't scoped to the shared daily calendar --
// Choose Your Own Golfable lets a member play any drill in the library,
// logged against today's date.
export async function getDrillById(drillId: string): Promise<{ drill: Drill; maxScore: number } | null> {
  const { data: drillRow } = await supabase.from("drills").select("*").eq("id", drillId).single<DrillRow>();
  if (!drillRow) return null;
  return { drill: toDrill(drillRow), maxScore: drillRow.max_score };
}

export async function getPersonalBest(
  userId: string,
  drillId: string,
  direction: ScoreDirection = "higher"
): Promise<number | null> {
  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", userId)
    .eq("drill_id", drillId)
    .order("score", { ascending: direction === "lower" })
    .limit(1)
    .maybeSingle();
  return data?.score ?? null;
}

// Counts by when a score was logged, not which date the drill was originally
// scheduled for -- so catching up an old Golfable from the Library still
// counts toward this week's goal. Counts distinct Pacific calendar days
// with at least one score, not total score rows, so playing several drills
// in one sitting (a daily Golfable plus a couple of Choose Your Own picks,
// say) only ever contributes one day toward the weekly goal.
export async function getSessionsThisWeek(userId: string): Promise<number> {
  const { data } = await supabase
    .from("scores")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", startOfWeekISO());
  if (!data) return 0;
  const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: GOLFABLE_TZ });
  const days = new Set(data.map((row) => dayFormatter.format(new Date(row.created_at as string))));
  return days.size;
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
  tier: HandicapTier;
}

// A studio member is covered by their studio's own private leaderboard --
// their scores don't also count toward the public/national one unless
// they've explicitly opted in (profiles.share_scores_publicly), so every
// public-facing leaderboard query excludes a studio member who hasn't.
const PUBLIC_LEADERBOARD_FILTER = "studio_id.is.null,share_scores_publicly.eq.true";

export async function getTierLeaderboard(
  drillId: string,
  tier: HandicapTier,
  date: string,
  direction: ScoreDirection = "higher"
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("scores")
    .select("user_id, score, profiles!inner(first_name, tier, studio_id, share_scores_publicly)")
    .eq("drill_id", drillId)
    .eq("date", date)
    .eq("profiles.tier", tier)
    .or(PUBLIC_LEADERBOARD_FILTER, { referencedTable: "profiles" })
    .order("score", { ascending: direction === "lower" });

  if (!data) return [];
  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id as string,
      firstName: profile.first_name as string,
      score: row.score as number,
      tier: profile.tier as HandicapTier,
    };
  });
}

// Unlike getTierLeaderboard, this spans every tier by default -- the Home
// screen's "live" leaderboard for whoever has played today's drill, ranked
// highest score first. The full Leaderboard screen also uses this (and
// getStudioLeaderboard below) for its "All" view, passing `tier` to narrow
// to one when a specific tier filter is picked instead -- `limit` left
// undefined there returns everyone rather than just a short preview list.
export async function getGlobalLeaderboard(
  drillId: string,
  date: string,
  limit: number | undefined,
  direction: ScoreDirection = "higher",
  tier?: HandicapTier
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from("scores")
    .select("user_id, score, profiles!inner(first_name, tier, studio_id, share_scores_publicly)")
    .eq("drill_id", drillId)
    .eq("date", date)
    .or(PUBLIC_LEADERBOARD_FILTER, { referencedTable: "profiles" })
    .order("score", { ascending: direction === "lower" });
  if (tier) query = query.eq("profiles.tier", tier);
  if (limit !== undefined) query = query.limit(limit);
  const { data } = await query;

  if (!data) return [];
  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id as string,
      firstName: profile.first_name as string,
      score: row.score as number,
      tier: profile.tier as HandicapTier,
    };
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
  share_scores_publicly?: boolean;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<void> {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

// Always the same object key per user (no extension) so re-uploading just
// overwrites it in place instead of orphaning the old file under a
// different name -- the correct MIME type still gets served from the
// contentType set at upload time. The avatars bucket is private and its
// storage.objects RLS policy scopes every read/write to the caller's own
// folder, so nobody else can upload here or ever fetch this file back.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/avatar`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { error: profileError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
  if (profileError) throw profileError;

  return path;
}

// The bucket is private, so the photo can only ever be fetched through a
// short-lived signed URL scoped to the requesting user's own RLS access --
// there is no public URL for it.
export async function getAvatarSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export interface ScoreHistoryEntry {
  date: string;
  createdAt: string;
  drill: Drill;
  maxScore: number;
  score: number;
}

// A category needs 3+ logged attempts before its Golfable Score populates.
export const GOLFABLE_SCORE_MIN_ATTEMPTS = 3;
// ...but only ever the 10 most recent count toward it, so an old bad
// stretch eventually rolls off and improvement is actually reachable.
export const GOLFABLE_SCORE_WINDOW = 10;

// getScoreHistory already orders newest-first, so slicing after filtering
// keeps the most recent GOLFABLE_SCORE_WINDOW attempts in that category.
// Exported so the score-detail page can list exactly the attempts that
// produced the number, without redefining "which ones count" a second time.
export function recentCategoryAttempts(history: ScoreHistoryEntry[], category: SkillCategory): ScoreHistoryEntry[] {
  return history.filter((h) => h.drill.category === category).slice(0, GOLFABLE_SCORE_WINDOW);
}

export interface GolfableScores {
  categoryScores: Record<SkillCategory, number | null>;
  categoryAttempts: Record<SkillCategory, number>;
  overallScore: number | null;
}

// Shared by Home and Progress so the two screens can never drift on the
// formula: each category is the average of score/maxScore (as a 0-100)
// across its most recent attempts, live off the same score history both
// screens already fetch -- never stored, so it's always current.
export function computeGolfableScores(history: ScoreHistoryEntry[]): GolfableScores {
  const categoryScores = {} as Record<SkillCategory, number | null>;
  const categoryAttempts = {} as Record<SkillCategory, number>;

  for (const category of SKILL_CATEGORIES) {
    const entries = recentCategoryAttempts(history, category);
    categoryAttempts[category] = entries.length;
    if (entries.length < GOLFABLE_SCORE_MIN_ATTEMPTS) {
      categoryScores[category] = null;
      continue;
    }
    const avgPct = entries.reduce((sum, e) => sum + e.score / e.maxScore, 0) / entries.length;
    categoryScores[category] = Math.round(avgPct * 100);
  }

  const allScores = SKILL_CATEGORIES.map((c) => categoryScores[c]);
  const overallScore = allScores.every((s) => s !== null)
    ? Math.round(allScores.reduce((sum, s) => sum + s!, 0) / allScores.length)
    : null;

  return { categoryScores, categoryAttempts, overallScore };
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

export interface AdminUserOverview {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: HandicapTier;
  weeklyGoal: number;
  marketingOptIn: boolean;
  createdAt: string;
  totalScores: number;
  sessionsThisWeek: number;
  lastActive: string | null;
  studioName: string | null;
  individualTier: string | null;
  subscriptionStatus: string | null;
}

// Admin-only: throws if the caller isn't flagged is_admin (enforced
// server-side in the RPC itself, not just hidden client-side).
export async function getAdminUserOverview(): Promise<AdminUserOverview[]> {
  const { data, error } = await supabase.rpc("admin_user_overview");
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    tier: row.tier as HandicapTier,
    weeklyGoal: row.weekly_goal as number,
    marketingOptIn: row.marketing_opt_in as boolean,
    createdAt: row.created_at as string,
    totalScores: Number(row.total_scores),
    sessionsThisWeek: Number(row.sessions_this_week),
    lastActive: (row.last_active as string) ?? null,
    studioName: (row.studio_name as string) ?? null,
    individualTier: (row.individual_tier as string) ?? null,
    subscriptionStatus: (row.subscription_status as string) ?? null,
  }));
}

export interface ClubDistanceEntry {
  id: string;
  club: string;
  distanceYards: number;
  createdAt: string;
}

// Inserts every swing from a session in one round trip -- each stays its
// own row, so the per-club average (computed client-side from all rows)
// naturally folds new sessions into the running average rather than
// overwriting it.
export async function logClubDistances(userId: string, club: string, distancesYards: number[]): Promise<void> {
  const { error } = await supabase
    .from("club_distances")
    .insert(distancesYards.map((distance_yards) => ({ user_id: userId, club, distance_yards })));
  if (error) throw error;
}

export async function deleteClubDistance(id: string): Promise<void> {
  const { error } = await supabase.from("club_distances").delete().eq("id", id);
  if (error) throw error;
}

export async function getClubDistances(userId: string): Promise<ClubDistanceEntry[]> {
  const { data } = await supabase
    .from("club_distances")
    .select("id, club, distance_yards, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map((row) => ({
    id: row.id as string,
    club: row.club as string,
    distanceYards: row.distance_yards as number,
    createdAt: row.created_at as string,
  }));
}

// Unlike getDrillForDate/getPastGolfables/getUpcomingGolfables, this isn't
// scoped to the shared daily calendar -- Challenge Mode lets you pick any
// drill in the library to compete on, so it needs the whole (optionally
// category-filtered) list.
export async function getAllDrills(category?: SkillCategory): Promise<{ drill: Drill; maxScore: number }[]> {
  let query = supabase.from("drills").select("*").order("name", { ascending: true });
  if (category) query = query.eq("category", category);
  const { data } = await query;
  if (!data) return [];
  return (data as DrillRow[]).map((row) => ({ drill: toDrill(row), maxScore: row.max_score }));
}

export interface Challenge {
  id: string;
  code: string;
  creatorId: string;
  creatorFirstName: string;
  drill: Drill;
  maxScore: number;
  wager: string | null;
  note: string | null;
  createdAt: string;
}

interface ChallengeRow {
  id: string;
  code: string;
  creator_id: string;
  wager: string | null;
  note: string | null;
  created_at: string;
  drills: DrillRow | DrillRow[] | null;
  profiles: { first_name: string } | { first_name: string }[] | null;
}

function toChallenge(row: ChallengeRow): Challenge | null {
  const drillRow = oneDrillRow(row.drills);
  if (!drillRow) return null;
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    code: row.code,
    creatorId: row.creator_id,
    creatorFirstName: profile?.first_name ?? "Someone",
    drill: toDrill(drillRow),
    maxScore: drillRow.max_score,
    wager: row.wager,
    note: row.note,
    createdAt: row.created_at,
  };
}

// Short, unambiguous (no 0/O/1/I/L) codes -- meant to be read aloud or
// texted at the range, not typed carefully at a desk.
const CHALLENGE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CHALLENGE_CODE_LENGTH = 5;

function generateChallengeCode(): string {
  let code = "";
  for (let i = 0; i < CHALLENGE_CODE_LENGTH; i++) {
    code += CHALLENGE_CODE_ALPHABET[Math.floor(Math.random() * CHALLENGE_CODE_ALPHABET.length)];
  }
  return code;
}

// No friends graph needed to "invite" someone -- creating a challenge just
// mints a shareable code and joins the creator as its first participant.
export async function createChallenge(
  creatorId: string,
  drillId: string,
  wager: string | null,
  note: string | null
): Promise<{ id: string; code: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateChallengeCode();
    const { data, error } = await supabase
      .from("challenges")
      .insert({ creator_id: creatorId, drill_id: drillId, code, wager, note })
      .select("id, code")
      .single();
    if (!error && data) {
      await joinChallenge(data.id as string, creatorId);
      return { id: data.id as string, code: data.code as string };
    }
    if (error && error.code !== "23505") throw error; // 23505 = unique_violation on the code -- retry with a new one
  }
  throw new Error("Couldn't generate a unique challenge code -- try again.");
}

export async function getChallengeByCode(code: string): Promise<Challenge | null> {
  const { data } = await supabase
    .from("challenges")
    .select("id, code, creator_id, wager, note, created_at, drills(*), profiles(first_name)")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (!data) return null;
  return toChallenge(data as unknown as ChallengeRow);
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  const { data } = await supabase
    .from("challenges")
    .select("id, code, creator_id, wager, note, created_at, drills(*), profiles(first_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return toChallenge(data as unknown as ChallengeRow);
}

// Upsert with ignoreDuplicates so re-entering a code you've already joined
// (or the creator revisiting their own challenge) is a harmless no-op
// instead of a unique-constraint error.
export async function joinChallenge(challengeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("challenge_participants")
    .upsert({ challenge_id: challengeId, user_id: userId }, { onConflict: "challenge_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
}

// Creator-only (enforced by RLS) -- deletes the challenge outright.
// challenge_participants cascades, so any joiners are removed too.
export async function cancelChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.from("challenges").delete().eq("id", challengeId);
  if (error) throw error;
}

export interface ChallengeParticipant {
  userId: string;
  firstName: string;
  score: number | null;
}

export async function getChallengeParticipants(
  challengeId: string,
  direction: ScoreDirection = "higher"
): Promise<ChallengeParticipant[]> {
  const { data } = await supabase
    .from("challenge_participants")
    .select("user_id, score, profiles!inner(first_name)")
    .eq("challenge_id", challengeId);
  if (!data) return [];
  return data
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        userId: row.user_id as string,
        firstName: profile.first_name as string,
        score: (row.score as number | null) ?? null,
      };
    })
    .sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return direction === "lower" ? a.score - b.score : b.score - a.score;
    });
}

export async function submitChallengeScore(challengeId: string, userId: string, score: number): Promise<void> {
  const { error } = await supabase
    .from("challenge_participants")
    .update({ score, submitted_at: new Date().toISOString() })
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);
  if (error) throw error;
}

export interface ChallengeSummary {
  id: string;
  code: string;
  drillName: string;
  category: SkillCategory;
  participantCount: number;
  myScore: number | null;
  createdAt: string;
}

export async function getMyChallenges(userId: string): Promise<ChallengeSummary[]> {
  const { data: participantRows } = await supabase
    .from("challenge_participants")
    .select("challenge_id, score")
    .eq("user_id", userId);
  if (!participantRows || participantRows.length === 0) return [];

  const challengeIds = participantRows.map((r) => r.challenge_id as string);
  const myScoreByChallenge = new Map(participantRows.map((r) => [r.challenge_id as string, r.score as number | null]));

  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("id, code, created_at, drills(name, category)")
    .in("id", challengeIds)
    .order("created_at", { ascending: false });
  if (!challengeRows) return [];

  const { data: allParticipants } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .in("challenge_id", challengeIds);
  const countByChallenge = new Map<string, number>();
  (allParticipants ?? []).forEach((row) => {
    const id = row.challenge_id as string;
    countByChallenge.set(id, (countByChallenge.get(id) ?? 0) + 1);
  });

  return challengeRows.map((row) => {
    const drillRow = Array.isArray(row.drills) ? row.drills[0] : row.drills;
    return {
      id: row.id as string,
      code: row.code as string,
      drillName: (drillRow?.name as string) ?? "Unknown Drill",
      category: (drillRow?.category as SkillCategory) ?? "driver",
      participantCount: countByChallenge.get(row.id as string) ?? 1,
      myScore: myScoreByChallenge.get(row.id as string) ?? null,
      createdAt: row.created_at as string,
    };
  });
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: string;
  canceledAt: string | null;
}

interface StudioRow {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  canceled_at: string | null;
}

function toStudio(row: StudioRow): Studio {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    canceledAt: row.canceled_at ?? null,
  };
}

export async function getStudioBySlug(slug: string): Promise<Studio | null> {
  const { data } = await supabase.from("studios").select("*").eq("slug", slug).maybeSingle<StudioRow>();
  return data ? toStudio(data) : null;
}

export async function getStudioById(studioId: string): Promise<Studio | null> {
  const { data } = await supabase.from("studios").select("*").eq("id", studioId).maybeSingle<StudioRow>();
  return data ? toStudio(data) : null;
}

// A member belongs to at most one studio -- joining a new one just
// overwrites the old value. Goes through the server because it also has
// to cancel any existing individual Stripe subscription (studio_id itself
// is service-role-only to write, see 0026_studio_lifecycle.sql).
export async function joinStudio(accessToken: string, studioId: string): Promise<void> {
  const res = await fetch("/api/join-studio", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ studioId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't join that studio -- try again.");
}

// Leaving is pure self-service -- no billing to unwind, since a studio
// member isn't individually billed while covered. They'll be walked
// through checkout again next time they open Profile.
export async function leaveStudio(): Promise<void> {
  const { error } = await supabase.rpc("leave_studio");
  if (error) throw error;
}

// Admin-only: ends the studio's coverage for every member at once, same
// effect as if each of them left individually.
export async function cancelStudio(studioId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_studio", { target_studio_id: studioId });
  if (error) throw error;
}

// Same shape as getGlobalLeaderboard, but filtered to one studio's roster
// instead of every Golfable member -- this is what a studio's members see
// as their primary, private leaderboard.
export async function getStudioLeaderboard(
  studioId: string,
  drillId: string,
  date: string,
  limit: number | undefined,
  direction: ScoreDirection = "higher",
  tier?: HandicapTier
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from("scores")
    .select("user_id, score, profiles!inner(first_name, studio_id, tier)")
    .eq("drill_id", drillId)
    .eq("date", date)
    .eq("profiles.studio_id", studioId)
    .order("score", { ascending: direction === "lower" });
  if (tier) query = query.eq("profiles.tier", tier);
  if (limit !== undefined) query = query.limit(limit);
  const { data } = await query;

  if (!data) return [];
  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id as string,
      firstName: profile.first_name as string,
      score: row.score as number,
      tier: profile.tier as HandicapTier,
    };
  });
}

// A member's personal rank is tracked within their studio (across every
// tier there, same as the studio leaderboard's default "All" view) if
// they're in one, or the public tier-wide board otherwise -- used for
// Today's rank card and the Leaderboard section's "My Week" view, so both
// agree on where "your rank" comes from.
export async function getRankBoard(
  studioId: string | null,
  drillId: string,
  tier: HandicapTier,
  date: string,
  direction: ScoreDirection = "higher"
): Promise<LeaderboardEntry[]> {
  return studioId
    ? getStudioLeaderboard(studioId, drillId, date, undefined, direction)
    : getTierLeaderboard(drillId, tier, date, direction);
}

export interface StudioRosterEntry {
  id: string;
  firstName: string;
  lastName: string;
  tier: HandicapTier;
  weeklyGoal: number;
  createdAt: string;
  totalScores: number;
  sessionsThisWeek: number;
  lastActive: string | null;
}

// Admin-only from the studio owner's side: throws if the caller doesn't
// own target_studio_id (enforced server-side in the RPC, not just hidden
// client-side).
export async function getStudioRoster(studioId: string): Promise<StudioRosterEntry[]> {
  const { data, error } = await supabase.rpc("studio_roster", { target_studio_id: studioId });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    tier: row.tier as HandicapTier,
    weeklyGoal: row.weekly_goal as number,
    createdAt: row.created_at as string,
    totalScores: Number(row.total_scores),
    sessionsThisWeek: Number(row.sessions_this_week),
    lastActive: (row.last_active as string) ?? null,
  }));
}

// Used by the Profile screen to decide whether to show a "Manage your
// studio" entry point -- most members get null back here.
export async function getStudioByOwnerId(ownerUserId: string): Promise<Studio | null> {
  const { data } = await supabase.from("studios").select("*").eq("owner_user_id", ownerUserId).maybeSingle<StudioRow>();
  return data ? toStudio(data) : null;
}

// Site-admin only. Goes through the server (not a direct table insert)
// because it also has to set the owner's studio_id and cancel any
// individual subscription they already had -- both of those touch
// service-role-only columns and Stripe. See api/create-studio.ts.
export async function createStudio(accessToken: string, name: string, ownerUserId: string): Promise<Studio> {
  const res = await fetch("/api/create-studio", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name, ownerUserId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't create that studio -- try again.");
  return { ...body, canceledAt: null } as Studio;
}

export interface StudioOverview extends Studio {
  ownerFirstName: string;
  ownerLastName: string;
  memberCount: number;
}

// Site-admin's studio list: studios + profiles are both publicly readable,
// so this is a plain composed query rather than a security-definer RPC.
export async function getStudiosOverview(): Promise<StudioOverview[]> {
  const { data: studioRows } = await supabase
    .from("studios")
    .select("*, profiles!owner_user_id(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (!studioRows || studioRows.length === 0) return [];

  const { data: memberRows } = await supabase.from("profiles").select("studio_id").not("studio_id", "is", null);
  const countByStudio = new Map<string, number>();
  (memberRows ?? []).forEach((row) => {
    const id = row.studio_id as string;
    countByStudio.set(id, (countByStudio.get(id) ?? 0) + 1);
  });

  return studioRows.map((row) => {
    const owner = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      ...toStudio(row as StudioRow),
      ownerFirstName: (owner?.first_name as string) ?? "Unknown",
      ownerLastName: (owner?.last_name as string) ?? "",
      memberCount: countByStudio.get(row.id as string) ?? 0,
    };
  });
}

// --- Individual billing -------------------------------------------------

// Assigns (once) and returns this member's individual pricing tier --
// 'free', 'tier_799', 'tier_1499', or 'tier_1999'. Returns null for a
// studio member, who's covered by their studio's flat fee instead.
export async function assignIndividualTier(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("assign_individual_tier", { target_user_id: userId });
  if (error) throw error;
  return data;
}

// Both of these call a Vercel serverless function (not Supabase directly)
// since creating a Checkout/Portal session requires the Stripe secret key,
// which never reaches the browser.
export async function createCheckoutSession(accessToken: string): Promise<string> {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't start checkout.");
  return body.url as string;
}

export async function createPortalSession(accessToken: string): Promise<string> {
  const res = await fetch("/api/create-portal-session", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't open billing portal.");
  return body.url as string;
}

export interface TestNotificationResult {
  sent: number;
  staleRemoved: number;
  errors: string[];
}

// Sends a push to the caller's own subscriptions only -- independent of
// the daily cron send, so it works as both a "did this turn on?" check
// and a VAPID-key diagnostic.
export async function sendTestNotification(accessToken: string): Promise<TestNotificationResult> {
  const res = await fetch("/api/send-test-notification", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't send a test notification.");
  return body as TestNotificationResult;
}

// ---------------------------------------------------------------------------
// Handicap tracking

export interface HandicapEntry {
  handicapIndex: number | null;
  avgScorePar72: number | null;
  recordedAt: string;
}

function toHandicapEntry(row: {
  handicap_index: number | null;
  avg_score_par72: number | null;
  recorded_at: string;
}): HandicapEntry {
  return {
    handicapIndex: row.handicap_index,
    avgScorePar72: row.avg_score_par72,
    recordedAt: row.recorded_at,
  };
}

export async function getLatestHandicap(userId: string): Promise<HandicapEntry | null> {
  const { data } = await supabase
    .from("handicap_history")
    .select("handicap_index, avg_score_par72, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toHandicapEntry(data) : null;
}

export async function getHandicapHistory(userId: string): Promise<HandicapEntry[]> {
  const { data } = await supabase
    .from("handicap_history")
    .select("handicap_index, avg_score_par72, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true });
  return (data ?? []).map(toHandicapEntry);
}

// One of handicapIndex/avgScorePar72 must be set -- enforced by a DB check
// constraint too, but validating client-side gives a clearer error.
export async function logHandicap(
  userId: string,
  handicapIndex: number | null,
  avgScorePar72: number | null
): Promise<void> {
  if (handicapIndex === null && avgScorePar72 === null) {
    throw new Error("Enter a handicap or an average score.");
  }
  const { error } = await supabase
    .from("handicap_history")
    .insert({ user_id: userId, handicap_index: handicapIndex, avg_score_par72: avgScorePar72 });
  if (error) throw error;
}

// A player's due for another update once 30 days have passed since their
// last one -- close enough to "monthly" without needing a cron job to
// track it.
const HANDICAP_PROMPT_INTERVAL_DAYS = 30;

export function isHandicapUpdateDue(latest: HandicapEntry | null): boolean {
  if (!latest) return true;
  const daysSince = (Date.now() - new Date(latest.recordedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= HANDICAP_PROMPT_INTERVAL_DAYS;
}

// ---------------------------------------------------------------------------
// Golfable Games ratings

export async function getMyRatingForDrill(userId: string, drillId: string): Promise<number | null> {
  const { data } = await supabase
    .from("drill_ratings")
    .select("rating")
    .eq("user_id", userId)
    .eq("drill_id", drillId)
    .maybeSingle();
  return data?.rating ?? null;
}

export async function rateDrill(userId: string, drillId: string, rating: number): Promise<void> {
  const { error } = await supabase
    .from("drill_ratings")
    .upsert({ user_id: userId, drill_id: drillId, rating }, { onConflict: "user_id,drill_id" });
  if (error) throw error;
}

export interface DrillRatingSummary {
  avgRating: number;
  ratingCount: number;
}

// Keyed by drill_id so ChooseGolfableScreen can look up each drill's
// community rating without a query per card.
export async function getAllDrillRatingSummaries(): Promise<Record<string, DrillRatingSummary>> {
  const { data } = await supabase.from("drill_rating_summary").select("drill_id, avg_rating, rating_count");
  const summaries: Record<string, DrillRatingSummary> = {};
  for (const row of data ?? []) {
    summaries[row.drill_id as string] = {
      avgRating: row.avg_rating as number,
      ratingCount: row.rating_count as number,
    };
  }
  return summaries;
}

export async function getMyDrillRatings(userId: string): Promise<Record<string, number>> {
  const { data } = await supabase.from("drill_ratings").select("drill_id, rating").eq("user_id", userId);
  const ratings: Record<string, number> = {};
  for (const row of data ?? []) ratings[row.drill_id as string] = row.rating as number;
  return ratings;
}

// ---------------------------------------------------------------------------
// My Bag

// Club Gapping is the more accurate, measured source, so a club's My Bag
// yardage comes from its Club Gapping average whenever one exists; only
// clubs with no logged swings fall back to the manual bag_clubs value.
// This is what keeps the two tools showing the same number for a club.
export async function getMyBag(userId: string): Promise<BagEntry[]> {
  const [{ data: bagRows }, { data: distanceRows }] = await Promise.all([
    supabase.from("bag_clubs").select("club, yardage").eq("user_id", userId),
    supabase.from("club_distances").select("club, distance_yards").eq("user_id", userId),
  ]);

  const manualByClub = new Map((bagRows ?? []).map((row) => [row.club as string, row.yardage as number | null]));

  const distancesByClub = new Map<string, number[]>();
  for (const row of distanceRows ?? []) {
    const club = row.club as string;
    const list = distancesByClub.get(club) ?? [];
    list.push(row.distance_yards as number);
    distancesByClub.set(club, list);
  }

  return BAG_CLUBS.map((club) => {
    const distances = distancesByClub.get(club);
    if (distances && distances.length > 0) {
      const yardage = Math.round(distances.reduce((sum, d) => sum + d, 0) / distances.length);
      return { club, yardage, source: "gapping" as const, sampleCount: distances.length };
    }
    return { club, yardage: manualByClub.get(club) ?? null, source: "manual" as const };
  });
}

export async function setBagClubYardage(userId: string, club: BagClub, yardage: number | null): Promise<void> {
  const { error } = await supabase
    .from("bag_clubs")
    .upsert({ user_id: userId, club, yardage }, { onConflict: "user_id,club" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// My Game -- a player's own anecdotal 1-10 read on each part of their game.
// No history, just a current snapshot; feeds "Recommended for You".

export async function getMyGameRatings(userId: string): Promise<Partial<Record<SkillCategory, number>>> {
  const { data } = await supabase.from("game_ratings").select("category, rating").eq("user_id", userId);
  const ratings: Partial<Record<SkillCategory, number>> = {};
  for (const row of data ?? []) ratings[row.category as SkillCategory] = row.rating as number;
  return ratings;
}

export async function setGameRating(userId: string, category: SkillCategory, rating: number): Promise<void> {
  const { error } = await supabase
    .from("game_ratings")
    .upsert(
      { user_id: userId, category, rating, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category" }
    );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Forum -- categories, threads, and replies. Every write (thread/reply
// creation, moderation review) goes through an api/forum-*.ts endpoint
// rather than a direct table insert/update -- see 0034_forum.sql for why: a
// post's status is decided by a server-side moderation check the client
// must not be able to set itself.

export type ForumContentStatus = "visible" | "pending_review" | "removed";

export interface ForumCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface ForumThreadSummary {
  id: string;
  categoryId: string;
  title: string;
  status: ForumContentStatus;
  pinned: boolean;
  createdAt: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  replyCount: number;
  lastActivityAt: string;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  status: ForumContentStatus;
  pinned: boolean;
  createdAt: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  body: string;
  status: ForumContentStatus;
  createdAt: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  const { data } = await supabase.from("forum_categories").select("id, slug, name, description").order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
  }));
}

export async function getForumCategoryBySlug(slug: string): Promise<ForumCategory | null> {
  const { data } = await supabase
    .from("forum_categories")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, slug: data.slug, name: data.name, description: data.description };
}

export async function getForumThreads(categoryId: string): Promise<ForumThreadSummary[]> {
  const { data } = await supabase
    .from("forum_thread_summary")
    .select("*")
    .eq("category_id", categoryId)
    .order("pinned", { ascending: false })
    .order("last_activity_at", { ascending: false });
  if (!data) return [];
  return data.map((row) => ({
    id: row.id as string,
    categoryId: row.category_id as string,
    title: row.title as string,
    status: row.status as ForumContentStatus,
    pinned: row.pinned as boolean,
    createdAt: row.created_at as string,
    authorId: row.author_id as string,
    authorFirstName: row.author_first_name as string,
    authorLastName: row.author_last_name as string,
    replyCount: Number(row.reply_count),
    lastActivityAt: row.last_activity_at as string,
  }));
}

export async function getForumThread(threadId: string): Promise<ForumThread | null> {
  const { data } = await supabase
    .from("forum_threads")
    .select("id, category_id, title, body, status, pinned, created_at, author_id, profiles!inner(first_name, last_name)")
    .eq("id", threadId)
    .maybeSingle();
  if (!data) return null;
  const author = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return {
    id: data.id,
    categoryId: data.category_id,
    title: data.title,
    body: data.body,
    status: data.status as ForumContentStatus,
    pinned: data.pinned,
    createdAt: data.created_at,
    authorId: data.author_id,
    authorFirstName: author.first_name as string,
    authorLastName: author.last_name as string,
  };
}

// Includes the caller's own pending/removed replies (RLS lets an author see
// their own regardless of status) -- the UI decides how to render those.
export async function getForumReplies(threadId: string): Promise<ForumReply[]> {
  const { data } = await supabase
    .from("forum_replies")
    .select("id, thread_id, body, status, created_at, author_id, profiles!inner(first_name, last_name)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return data.map((row) => {
    const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id as string,
      threadId: row.thread_id as string,
      body: row.body as string,
      status: row.status as ForumContentStatus,
      createdAt: row.created_at as string,
      authorId: row.author_id as string,
      authorFirstName: author.first_name as string,
      authorLastName: author.last_name as string,
    };
  });
}

export interface ForumPostResult {
  id: string;
  status: ForumContentStatus;
  createdAt: string;
}

export async function createForumThread(
  accessToken: string,
  categoryId: string,
  title: string,
  body: string
): Promise<ForumPostResult> {
  const res = await fetch("/api/forum-create-thread", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ categoryId, title, body }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Couldn't post that -- try again.");
  return { id: result.id, status: result.status, createdAt: result.createdAt };
}

export async function createForumReply(accessToken: string, threadId: string, body: string): Promise<ForumPostResult> {
  const res = await fetch("/api/forum-create-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ threadId, body }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Couldn't post that reply -- try again.");
  return { id: result.id, status: result.status, createdAt: result.createdAt };
}

// ---------------------------------------------------------------------------
// Forum moderation (admin) -- flagged posts awaiting a human decision.

export interface ForumModerationFlag {
  id: string;
  contentType: "thread" | "reply";
  contentId: string;
  authorFirstName: string;
  authorLastName: string;
  reason: "word_list" | "ai_flagged" | "both";
  matchedTerms: string[];
  aiCategories: string[];
  aiReasoning: string | null;
  createdAt: string;
  title: string | null;
  body: string;
}

export async function getForumModerationQueue(): Promise<ForumModerationFlag[]> {
  const { data: flags } = await supabase
    .from("forum_moderation_flags")
    .select("id, content_type, content_id, reason, matched_terms, ai_categories, ai_reasoning, created_at, profiles!inner(first_name, last_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (!flags || flags.length === 0) return [];

  const threadIds = flags.filter((f) => f.content_type === "thread").map((f) => f.content_id);
  const replyIds = flags.filter((f) => f.content_type === "reply").map((f) => f.content_id);

  const [{ data: threads }, { data: replies }] = await Promise.all([
    threadIds.length
      ? supabase.from("forum_threads").select("id, title, body").in("id", threadIds)
      : Promise.resolve({ data: [] as { id: string; title: string; body: string }[] }),
    replyIds.length
      ? supabase.from("forum_replies").select("id, body").in("id", replyIds)
      : Promise.resolve({ data: [] as { id: string; body: string }[] }),
  ]);

  const threadById = new Map((threads ?? []).map((t) => [t.id, t]));
  const replyById = new Map((replies ?? []).map((r) => [r.id, r]));

  return flags.map((flag) => {
    const author = Array.isArray(flag.profiles) ? flag.profiles[0] : flag.profiles;
    const content =
      flag.content_type === "thread" ? threadById.get(flag.content_id) : replyById.get(flag.content_id);
    return {
      id: flag.id,
      contentType: flag.content_type as "thread" | "reply",
      contentId: flag.content_id,
      authorFirstName: author.first_name as string,
      authorLastName: author.last_name as string,
      reason: flag.reason as "word_list" | "ai_flagged" | "both",
      matchedTerms: flag.matched_terms as string[],
      aiCategories: flag.ai_categories as string[],
      aiReasoning: flag.ai_reasoning as string | null,
      createdAt: flag.created_at as string,
      title: flag.content_type === "thread" ? (content as { title?: string } | undefined)?.title ?? null : null,
      body: content?.body ?? "",
    };
  });
}

export async function reviewForumFlag(
  accessToken: string,
  flagId: string,
  decision: "approved" | "rejected"
): Promise<void> {
  const res = await fetch("/api/forum-review-flag", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ flagId, decision }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't review that flag -- try again.");
}
