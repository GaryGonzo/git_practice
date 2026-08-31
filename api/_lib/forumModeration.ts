import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

// Underscore-prefixed so Vercel doesn't treat this as its own API route --
// it's a shared module for api/forum-create-thread.ts and
// api/forum-create-reply.ts, not an endpoint.

// Fast, local, catches literal profanity/slurs (including common
// leetspeak/spacing variants) even if the AI call below is slow or down.
// The word list itself comes from the `obscenity` package (MIT, actively
// maintained) rather than being hand-authored here.
const wordListMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

function wordListCheck(text: string): { flagged: boolean; matchedTerms: string[] } {
  const matches = wordListMatcher.getAllMatches(text);
  if (matches.length === 0) return { flagged: false, matchedTerms: [] };
  const terms = matches.map(
    (match) => englishDataset.getPayloadWithPhraseMetadata(match).phraseMetadata?.originalWord ?? "flagged term",
  );
  return { flagged: true, matchedTerms: [...new Set(terms)] };
}

const ModerationClassification = z.object({
  flagged: z.boolean(),
  categories: z.array(
    z.enum(["profanity", "sexual_content", "sexual_slur", "racist_slur", "hate_or_harassment", "other"]),
  ),
  reasoning: z.string(),
});

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for a friendly golf community forum. Members post casual chat, questions about golf and the app, and competitive banter.

Flag a post ONLY if it contains: curse words/profanity, sexual content or sexual slurs, racist or other hateful slurs, or targeted harassment/hate speech -- including disguised or misspelled variants of these.

Do NOT flag: golf trash-talk that isn't slurs or harassment ("you shanked that", "your short game is rough today"), strong opinions, criticism of the app or a drill, or ordinary negative sentiment.

When genuinely unsure whether something crosses the line, flag it -- a false positive just means a quick human check, but a false negative lets real slurs or hate speech through.`;

let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

async function aiCheck(
  text: string,
): Promise<{ flagged: boolean; categories: string[]; reasoning: string } | null> {
  try {
    const response = await getAnthropicClient().messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: MODERATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
      output_config: { format: zodOutputFormat(ModerationClassification) },
    });
    return response.parsed_output;
  } catch (err) {
    // Degrade gracefully to word-list-only rather than blocking every post
    // (fail-open on the AI layer, not on moderation as a whole) or silently
    // letting content through unlogged.
    console.error("forum moderation: Claude classification failed", err);
    return null;
  }
}

export interface ModerationOutcome {
  flagged: boolean;
  reason: "word_list" | "ai_flagged" | "both" | null;
  matchedTerms: string[];
  aiCategories: string[];
  aiReasoning: string | null;
}

export async function moderateContent(text: string): Promise<ModerationOutcome> {
  const wordList = wordListCheck(text);
  const ai = await aiCheck(text);
  const aiFlagged = ai?.flagged ?? false;

  let reason: ModerationOutcome["reason"] = null;
  if (wordList.flagged && aiFlagged) reason = "both";
  else if (wordList.flagged) reason = "word_list";
  else if (aiFlagged) reason = "ai_flagged";

  return {
    flagged: wordList.flagged || aiFlagged,
    reason,
    matchedTerms: wordList.matchedTerms,
    aiCategories: ai?.categories ?? [],
    aiReasoning: ai?.reasoning ?? null,
  };
}
