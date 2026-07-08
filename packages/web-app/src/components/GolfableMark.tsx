interface GolfableMarkProps {
  className?: string;
  tone?: "on-light" | "on-dark";
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 55;
const RING_GAP = RING_CIRCUMFERENCE * 0.19;
const RING_VISIBLE = RING_CIRCUMFERENCE - RING_GAP;

export function GolfableMark({ className, tone = "on-light" }: GolfableMarkProps) {
  const bg = tone === "on-light" ? "#1F4D36" : "#000000";
  const mark = "#FFFFFF";
  const ring = tone === "on-dark" ? "#7BC142" : undefined;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Golfable">
      <circle cx="100" cy="100" r="100" fill={bg} />
      {tone === "on-dark" && (
        <circle cx="100" cy="100" r="97" fill="none" stroke={ring} strokeWidth="2" opacity="0.9" />
      )}
      {/* G ring */}
      <circle
        cx="100"
        cy="100"
        r="55"
        fill="none"
        stroke={mark}
        strokeWidth="26"
        strokeDasharray={`${RING_VISIBLE} ${RING_GAP}`}
        strokeDashoffset={-RING_GAP / 2}
      />
      {/* G crossbar */}
      <rect x="100" y="93" width="68" height="26" rx="4" fill={mark} />
      {/* Orbit swoosh */}
      <path
        d="M 48,128 Q 88,96 152,66"
        fill="none"
        stroke={tone === "on-dark" ? ring : mark}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="158" cy="62" r="11" fill={tone === "on-dark" ? ring : mark} />
    </svg>
  );
}
