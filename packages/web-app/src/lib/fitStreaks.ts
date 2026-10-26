// Pure streak math for Golfable Fit -- no Supabase, so it can be checked
// in isolation. Dates are Pacific YYYY-MM-DD strings throughout.

function shiftISO(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function mondayOf(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return shiftISO(date, dow === 0 ? -6 : 1 - dow);
}

// Days a yoga routine item is scheduled, from the first day yoga was on
// the plan up to (and including) today. Each such day is a planned
// session: checking off yoga that day counts, skipping it is a miss.
export function yogaPlannedDays(daysOfWeek: Iterable<number>, startDate: string | null, today: string): string[] {
  const dows = new Set(daysOfWeek);
  if (!startDate || dows.size === 0 || startDate > today) return [];
  const out: string[] = [];
  for (let day = startDate; day <= today; day = shiftISO(day, 1)) {
    if (dows.has(new Date(`${day}T00:00:00Z`).getUTCDay())) out.push(day);
  }
  return out;
}

// Sessions done in a stretch of days: every completed lift, plus one per
// distinct day with a yoga check-in. A lift and yoga on the same day are
// two sessions.
export function sessionsDone(liftDays: Iterable<string>, yogaDays: Iterable<string>): number {
  return [...liftDays].length + new Set(yogaDays).size;
}

export interface TrainingStreak {
  // Workouts completed since the streak started.
  sessions: number;
  // Distinct Mon-Sun weeks with at least one of those workouts.
  weeks: number;
  since: string | null;
  // True when the most recent planned day was missed -- one more miss ends it.
  onThinIce: boolean;
}

// Walks back from today. A completed workout always counts (planned or
// not). Missing one planned day is forgiven; missing two planned days in
// a row ends the streak. Today never counts as a miss -- it's still
// in progress.
export function trainingStreak(planned: Iterable<string>, completed: Iterable<string>, today: string, lookbackDays = 180): TrainingStreak {
  const plannedSet = new Set(planned);
  const completedSet = new Set(completed);
  let sessions = 0;
  let missesInARow = 0;
  let since: string | null = null;
  let onThinIce = false;
  let seenPlannedOrDone = false;
  const weeks = new Set<string>();

  for (let i = 0; i < lookbackDays; i++) {
    const day = shiftISO(today, -i);
    if (completedSet.has(day)) {
      sessions++;
      since = day;
      weeks.add(mondayOf(day));
      missesInARow = 0;
      seenPlannedOrDone = true;
    } else if (plannedSet.has(day) && day < today) {
      missesInARow++;
      if (!seenPlannedOrDone) onThinIce = true;
      seenPlannedOrDone = true;
      if (missesInARow >= 2) break;
    }
  }
  if (sessions === 0) onThinIce = false;
  return { sessions, weeks: weeks.size, since, onThinIce };
}

export interface DayStreak {
  length: number;
  startDate: string | null;
}

// Consecutive days hit, ending today if today is already hit, otherwise
// ending yesterday (today is still open, so it can't break the streak).
export function dayStreak(hits: Map<string, boolean>, today: string, lookbackDays = 366): DayStreak {
  let day = hits.get(today) ? today : shiftISO(today, -1);
  let length = 0;
  let startDate: string | null = null;
  while (length < lookbackDays && hits.get(day)) {
    length++;
    startDate = day;
    day = shiftISO(day, -1);
  }
  return { length, startDate };
}

export const NUTRITION_MILESTONES = [7, 14, 21] as const;

// Milestones a streak has reached, each with the date it was reached --
// that date is part of the badge's uniqueness, so re-checking an ongoing
// streak never awards the same milestone twice, but a fresh streak can.
export function reachedMilestones(streak: DayStreak): { days: number; earnedOn: string }[] {
  if (!streak.startDate) return [];
  return NUTRITION_MILESTONES.filter((m) => streak.length >= m).map((m) => ({ days: m, earnedOn: shiftISO(streak.startDate!, m - 1) }));
}
