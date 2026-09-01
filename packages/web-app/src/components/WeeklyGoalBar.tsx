interface WeeklyGoalBarProps {
  completed: number;
  goal: number;
}

// A row of segments, one per Golfable in the weekly goal, filling in as
// they're completed -- same information as WeeklyGoalRing's circle, but
// flatter and narrower, for spots (like Home's header) where a big ring
// would crowd everything below it.
export function WeeklyGoalBar({ completed, goal }: WeeklyGoalBarProps) {
  const overflow = Math.max(completed - goal, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Weekly Goal</p>
        <p className="font-label text-xs font-semibold text-neutral-600">
          {completed}/{goal} Golfables
          {overflow > 0 && <span className="text-gold"> +{overflow}</span>}
        </p>
      </div>
      <div className="mt-1.5 flex gap-1">
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} className={`h-2.5 flex-1 rounded-full ${i < completed ? "bg-brand" : "bg-neutral-200"}`} />
        ))}
      </div>
    </div>
  );
}
