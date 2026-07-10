import { useEffect } from "react";

const SCORE_MESSAGES: ((name: string) => string)[] = [
  (name) => `Nicely done, ${name}. Way to go!`,
  () => "Golfable done ✅. Keepin those yips at bay!",
  () => "Progress!",
  (name) => `That's a wrap, ${name} — nice work.`,
  () => "Boom! Another Golfable in the books.",
  () => "Logged and legendary.",
  (name) => `Keep that streak alive, ${name}!`,
  () => "Solid rep. See you tomorrow.",
];

export function randomScoreMessage(firstName: string): string {
  return SCORE_MESSAGES[Math.floor(Math.random() * SCORE_MESSAGES.length)](firstName);
}

const DEFAULT_PARTICLES = ["⛳", "🎉", "✨", "🏌️"];

interface CelebrationToastProps {
  message: string;
  particles?: string[];
  onDone: () => void;
}

// A brief, non-blocking toast used both for a fresh score submission and for
// hitting the weekly goal. Self-dismisses -- no confirmation click needed.
export function CelebrationToast({ message, particles = DEFAULT_PARTICLES, onDone }: CelebrationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-6">
      <div
        className="relative flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-white shadow-xl"
        style={{ animation: "celebration-pop 3.2s ease forwards" }}
      >
        {particles.map((particle, i) => (
          <span
            key={i}
            className="absolute -top-3 text-lg"
            style={{
              left: `${10 + i * 25}%`,
              animation: `celebration-particle 1.3s ease-out ${i * 0.12}s forwards`,
            }}
            aria-hidden="true"
          >
            {particle}
          </span>
        ))}
        <span className="font-label text-sm font-semibold whitespace-nowrap">{message}</span>
      </div>
    </div>
  );
}
