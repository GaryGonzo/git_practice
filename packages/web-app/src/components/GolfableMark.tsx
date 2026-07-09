interface GolfableMarkProps {
  className?: string;
  tone?: "on-light" | "on-dark";
}

export function GolfableMark({ className, tone = "on-light" }: GolfableMarkProps) {
  const src = tone === "on-dark" ? "/golfable-mark-white.png" : "/golfable-mark-green.png";
  return <img src={src} alt="Golfable" className={className} />;
}
