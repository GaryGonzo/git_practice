// Best-effort keyword match so a custom request/task gets a sensible emoji
// without asking the user to pick one. Falls back to a plain pin.
const EMOJI_KEYWORDS: [string, string][] = [
  ["beer", "🍺"],
  ["wine", "🍷"],
  ["sandwich", "🥪"],
  ["snack", "🍫"],
  ["golf", "⛳"],
  ["dog", "🐕"],
  ["cat", "🐈"],
  ["trash", "🗑️"],
  ["garbage", "🗑️"],
  ["laundry", "🧺"],
  ["dish", "🍽️"],
  ["vacuum", "🧹"],
  ["clean", "🧹"],
  ["lawn", "🌱"],
  ["grass", "🌱"],
  ["car", "🚗"],
  ["grocery", "🛒"],
  ["shower", "🚿"],
  ["massage", "💆"],
  ["kiss", "💋"],
  ["movie", "🎬"],
  ["bath", "🛁"],
  ["light", "💡"],
  ["bulb", "💡"],
  ["nap", "😴"],
  ["sleep", "😴"],
  ["breakfast", "🍳"],
  ["coffee", "☕"],
  ["flower", "💐"],
  ["candle", "🕯️"],
  ["date", "🌹"],
  ["spa", "💅"],
  ["foot", "🦶"],
  ["back", "💆"],
];

export function guessEmoji(label: string): string {
  const lower = label.toLowerCase();
  for (const [keyword, emoji] of EMOJI_KEYWORDS) {
    if (lower.includes(keyword)) return emoji;
  }
  return "📌";
}
