import type { AskUrgency, RequestTier } from "../types";

export const URGENCY_ORDER: AskUrgency[] = ["emergency", "urgent", "soon", "whenever"];

export const URGENCY_INFO: Record<AskUrgency, { emoji: string; label: string; hint: string; className: string }> = {
  whenever: { emoji: "😌", label: "Whenever", hint: "Zero rush.", className: "bg-neutral-100 text-neutral-600" },
  soon: { emoji: "🙂", label: "Kinda soon", hint: "Today would be nice.", className: "bg-blue-100 text-blue-800" },
  urgent: {
    emoji: "😬",
    label: "For real",
    hint: "Don't make me ask twice.",
    className: "bg-amber-100 text-amber-800",
  },
  emergency: {
    emoji: "🚨",
    label: "CODE RED",
    hint: "I am not okay. Move.",
    className: "bg-red-100 text-red-700 animate-pulse",
  },
};

export const TIER_INFO: Record<RequestTier, { emoji: string; label: string; className: string }> = {
  small: { emoji: "🐣", label: "Quick one", className: "bg-neutral-100 text-neutral-600" },
  medium: { emoji: "🎯", label: "Bigger ask", className: "bg-gold/20 text-gold" },
  large: { emoji: "🎁", label: "Go big", className: "bg-brand-light text-brand-dark" },
};

export function sortByUrgency<T extends { urgency: AskUrgency; created_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rankDiff = URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
