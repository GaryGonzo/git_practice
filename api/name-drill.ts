import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Names a member's custom drill when they leave the name blank. Server-side
// because it needs the Anthropic key. The client falls back to a plain
// "<Club> Drill" name if this fails, so saving a drill never depends on it.

const CATEGORY_LABELS: Record<string, string> = {
  driver: "Driver & Woods",
  irons: "Irons",
  wedges: "Wedges",
  putter: "Putter",
};

const DrillName = z.object({ name: z.string() });

const SYSTEM_PROMPT = `You name golf practice drills for Golfable, a daily golf skill challenge app ("the CrossFit of golf skills").

Write ONE name for the drill described. Rules:
- 1 to 3 words, punchy and memorable, Title Case. Good examples of the house style: "Par Maker", "Texas Runner", "Fairway Finder", "Sweet Spot", "Step-Back Ladder", "The Gate", "Up and Down".
- The name should hint at what the drill actually is (the shot, the target, the format) -- not generic hype.
- Don't use the words "Drill", "Challenge", "Golfable", or "Custom". No emoji, no quotes, no punctuation besides a hyphen or apostrophe.
- Don't reuse any name in the "avoid" list.
- Keep it clean and friendly.`;

let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clipList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((v) => clip(v, maxLen)).filter(Boolean);
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

  const body = (req.body ?? {}) as Record<string, unknown>;
  const category = CATEGORY_LABELS[clip(body.category, 20)];
  const setup = clip(body.setupDescription, 1000);
  const rules = clip(body.rulesDescription, 1500);
  if (!category || (!setup && !rules)) {
    res.status(400).json({ error: "category and a setup or rules description are required" });
    return;
  }

  const direction = body.scoreDirection === "lower" ? "lower is better" : "higher is better";
  const maxScore = Number(body.maxScore);
  const description = [
    `Club category: ${category}`,
    `Setup: ${setup || "(none given)"}`,
    `Equipment: ${clipList(body.equipment, 12, 60).join(", ") || "(none given)"}`,
    `How to play: ${rules || "(none given)"}`,
    `Scoring: ${clipList(body.scoring, 12, 200).join(" | ") || "(none given)"}`,
    `Score: ${direction}${Number.isFinite(maxScore) ? `, out of ${maxScore}` : ""}`,
    `Avoid: ${clipList(body.avoid, 100, 60).join(", ") || "(none)"}`,
  ].join("\n");

  try {
    const response = await getAnthropicClient().messages.parse({
      model: "claude-haiku-5-5",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: description }],
      output_config: { format: zodOutputFormat(DrillName) },
    });
    const name = (response.parsed_output?.name ?? "")
      .replace(/["“”]/g, "")
      .replace(/\b(drill|challenge)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    if (!name) {
      res.status(502).json({ error: "no name returned" });
      return;
    }
    res.status(200).json({ name });
  } catch (err) {
    console.error("name-drill: Claude call failed", err);
    res.status(502).json({ error: "naming unavailable" });
  }
}
