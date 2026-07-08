interface WeeklyGoalRingProps {
  completed: number;
  goal: number;
  size?: number;
}

export function WeeklyGoalRing({ completed, goal, size = 96 }: WeeklyGoalRingProps) {
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
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1F4D36"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl leading-none">
          {completed}/{goal}
        </span>
        <span className="font-label text-[10px] tracking-wide text-neutral-500 uppercase">
          this week
        </span>
      </div>
      {overflow > 0 && (
        <div className="bg-gold font-label absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
          +{overflow}
        </div>
      )}
    </div>
  );
}
