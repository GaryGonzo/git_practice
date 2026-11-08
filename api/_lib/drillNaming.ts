import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Underscore-prefixed so Vercel doesn't treat this as its own route -- it's
// used by api/custom-drill.ts to name a drill whose name was left blank.

const CATEGORY_LABELS: Record<string, string> = {
  driver: "Driver & Woods",
  irons: "Irons",
  wedges: "Wedges",
  putter: "Putter",
};

const CATEGORY_SHORT: Record<string, string> = {
  driver: "Driver",
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

export interface DrillForNaming {
  category: string;
  setupDescription: string;
  equipment: string[];
  rulesDescription: string;
  scoring: string[];
  scoreDirection: "higher" | "lower";
  maxScore: number;
}

/** "Wedges Drill", then "Wedges Drill 2", ... -- used when the AI call fails. */
export function fallbackDrillName(category: string, avoid: string[]): string {
  const base = `${CATEGORY_SHORT[category] ?? "My"} Drill`;
  const taken = new Set(avoid.map((n) => n.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`.toLowerCase())) n++;
  return `${base} ${n}`;
}

/** Names a drill from what it is. Never throws -- falls back to a plain name. */
export async function nameDrill(drill: DrillForNaming, avoid: string[]): Promise<string> {
  const description = [
    `Club category: ${CATEGORY_LABELS[drill.category] ?? drill.category}`,
    `Setup: ${drill.setupDescription || "(none given)"}`,
    `Equipment: ${drill.equipment.join(", ") || "(none given)"}`,
    `How to play: ${drill.rulesDescription || "(none given)"}`,
    `Scoring: ${drill.scoring.join(" | ") || "(none given)"}`,
    `Score: ${drill.scoreDirection === "lower" ? "lower is better" : "higher is better"}, out of ${drill.maxScore}`,
    `Avoid: ${avoid.slice(0, 100).join(", ") || "(none)"}`,
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
    if (name && !avoid.some((a) => a.toLowerCase() === name.toLowerCase())) return name;
  } catch (err) {
    console.error("drill naming: Claude call failed", err);
  }
  return fallbackDrillName(drill.category, avoid);
}
