import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { moderateContent } from "./_lib/forumModeration.js";
import { nameDrill } from "./_lib/drillNaming.js";

// Every write to a member's own drill goes through here (see
// 0069_custom_drills.sql -- there are no client write policies on drills).
// Two reasons it's server-side:
//   1. A drill shared with the community is public text, so it has to pass
//      the same word filter + AI check the forum uses, and the client must
//      not be able to skip that.
//   2. A blank name gets filled in by Claude from the drill itself.
//
// POST { action: "save", id?, drill: {...} } -> { id, name }
// POST { action: "archive", id }             -> { ok: true }

const CATEGORIES = ["driver", "irons", "wedges", "putter"] as const;
type Category = (typeof CATEGORIES)[number];

interface CleanDrill {
  name: string;
  category: Category;
  setupDescription: string;
  equipment: string[];
  rulesDescription: string;
  scoring: string[];
  maxScore: number;
  scoreDirection: "higher" | "lower";
  goal: number | null;
  visibility: "private" | "community";
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => str(v, maxLen)).filter(Boolean).slice(0, maxItems);
}

function parseDrill(raw: unknown): CleanDrill | string {
  const d = (raw ?? {}) as Record<string, unknown>;
  const category = str(d.category, 20) as Category;
  if (!CATEGORIES.includes(category)) return "Pick which club this drill is for.";
  const setupDescription = str(d.setupDescription, 1000);
  if (!setupDescription) return "Add a quick setup description.";
  const rulesDescription = str(d.rulesDescription, 1500);
  if (!rulesDescription) return "Explain how the drill is played.";
  const scoring = list(d.scoring, 12, 300);
  if (scoring.length === 0) return "Add at least one scoring rule.";
  const maxScore = Number(d.maxScore);
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 999) return "Max score has to be a whole number from 1 to 999.";
  const goal = d.goal === null || d.goal === undefined || d.goal === "" ? null : Number(d.goal);
  if (goal !== null && (!Number.isInteger(goal) || goal < 0 || goal > maxScore)) return `Your goal has to be a whole number from 0 to ${maxScore}.`;
  return {
    name: str(d.name, 60),
    category,
    setupDescription,
    equipment: list(d.equipment, 12, 60),
    rulesDescription,
    scoring,
    maxScore,
    scoreDirection: d.scoreDirection === "lower" ? "lower" : "higher",
    goal,
    visibility: d.visibility === "community" ? "community" : "private",
  };
}

// One goal for every tier, encoded like official targets so the app's
// isTargetHit/formatScore read it unchanged: "N/max", bare "N" for
// lower-is-better, "" for no goal.
function encodeGoal(drill: CleanDrill): string {
  if (drill.goal === null) return "";
  return drill.scoreDirection === "lower" ? `${drill.goal}` : `${drill.goal}/${drill.maxScore}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!accessToken) {
    res.status(401).json({ error: "missing access token" });
    return;
  }

  const userScoped = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userScoped.auth.getUser(accessToken);
  if (userError || !user) {
    res.status(401).json({ error: "invalid access token" });
    return;
  }

  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const body = (req.body ?? {}) as { action?: string; id?: string; drill?: unknown };

  // Editing or removing: the drill has to exist and be the caller's.
  let existingId: string | null = null;
  if (body.id) {
    const { data: existing } = await service.from("drills").select("id, created_by").eq("id", body.id).maybeSingle();
    if (!existing || existing.created_by !== user.id) {
      res.status(404).json({ error: "drill not found" });
      return;
    }
    existingId = existing.id as string;
  }

  if (body.action === "archive") {
    if (!existingId) {
      res.status(400).json({ error: "id is required" });
      return;
    }
    const { error } = await service.from("drills").update({ archived_at: new Date().toISOString() }).eq("id", existingId);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (body.action !== "save") {
    res.status(400).json({ error: "unknown action" });
    return;
  }

  const parsed = parseDrill(body.drill);
  if (typeof parsed === "string") {
    res.status(400).json({ error: parsed });
    return;
  }
  const drill = parsed;

  if (!drill.name) {
    const { data: mine } = await service
      .from("drills")
      .select("name")
      .eq("created_by", user.id)
      .is("archived_at", null)
      .neq("id", existingId ?? "");
    drill.name = await nameDrill(drill, (mine ?? []).map((r) => r.name as string));
  }

  // Public text gets the forum's filter. Private drills only the author
  // ever sees, so they're left alone -- and re-checked the moment they're
  // switched to community.
  if (drill.visibility === "community") {
    const text = [
      drill.name,
      drill.setupDescription,
      drill.equipment.join(", "),
      drill.rulesDescription,
      drill.scoring.join("\n"),
    ].join("\n\n");
    const moderation = await moderateContent(text);
    if (moderation.flagged) {
      res.status(422).json({
        error:
          "Some of that wording can't be shared with the community. Clean it up and try again, or save the drill as private.",
        flagged: true,
      });
      return;
    }
  }

  const target = encodeGoal(drill);
  const row = {
    name: drill.name,
    category: drill.category,
    setup_description: drill.setupDescription,
    setup_equipment: drill.equipment,
    rules_description: drill.rulesDescription,
    rules_scoring: drill.scoring,
    max_score: drill.maxScore,
    score_direction: drill.scoreDirection,
    target_scratch: target,
    target_low: target,
    target_mid: target,
    target_high: target,
    visibility: drill.visibility,
  };

  const id = existingId ?? `custom-${randomUUID()}`;
  const { error } = existingId
    ? await service.from("drills").update(row).eq("id", id)
    : await service.from("drills").insert({ id, created_by: user.id, ...row });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ id, name: drill.name });
}
