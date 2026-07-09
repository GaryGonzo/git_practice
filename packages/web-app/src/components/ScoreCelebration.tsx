import { useEffect, useState } from "react";

const MESSAGES: ((name: string) => string)[] = [
  (name) => `Nicely done, ${name}. Way to go!`,
  () => "Golfable done ✅. Keepin those yips at bay!",
  () => "Progress!",
  (name) => `That's a wrap, ${name} — nice work.`,
  () => "Boom! Another Golfable in the books.",
  () => "Logged and legendary.",
  (name) => `Keep that streak alive, ${name}!`,
  () => "Solid rep. See you tomorrow.",
];

const PARTICLES = ["⛳", "🎉", "✨", "🏌️"];

interface ScoreCelebrationProps {
  firstName: string;
  onDone: () => void;
}

// A brief, non-blocking toast that fires once right after a fresh score
// submission (not when revisiting an already-completed day). Picks a random
// line each time and self-dismisses -- no confirmation click needed.
export function ScoreCelebration({ firstName, onDone }: ScoreCelebrationProps) {
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)](firstName));

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
        {PARTICLES.map((particle, i) => (
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
