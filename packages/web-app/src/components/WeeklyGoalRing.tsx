interface WeeklyGoalRingProps {
  completed: number;
  goal: number;
  size?: number;
  /** "dark" draws for a dark background (white type, translucent track). */
  tone?: "light" | "dark";
}

export function WeeklyGoalRing({ completed, goal, size = 96, tone = "light" }: WeeklyGoalRingProps) {
  const dark = tone === "dark";
  const strokeWidth = 8;
  const radius = size / 2 - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(completed / goal, 1);
  const overflow = Math.max(completed - goal, 0);

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.15)" : "#E5E5E5"}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dark ? "#C6A64B" : "#1F4D36"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display leading-none ${size < 64 ? "text-xl" : "text-2xl"} ${dark ? "text-white" : ""}`}>
          {completed}/{goal}
        </span>
        {size >= 64 && (
          <span className={`font-label text-[11px] font-medium ${dark ? "text-white/60" : "text-neutral-500"}`}>this week</span>
        )}
      </div>
      {overflow > 0 && (
        <div className="bg-gold font-label absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
          +{overflow}
        </div>
      )}
    </div>
  );
}
