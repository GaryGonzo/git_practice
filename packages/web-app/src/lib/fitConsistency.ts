// Consistency for Golfable Fit: workouts this week, a week streak and the
// last few weeks as a grid of days. Weeks start on Monday. The weekly goal
// is 3 workouts (the plan is 3-4 a week).

export const WEEKLY_GOAL = 3;

function parse(d: string): Date {
  return new Date(`${d}T12:00:00`);
}

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekStart(date: string): string {
  const d = parse(date);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return iso(d);
}

function addDays(date: string, n: number): string {
  const d = parse(date);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export interface Consistency {
  thisWeek: number;
  /** Weeks in a row hitting the goal, counting this week once it's hit. */
  weekStreak: number;
  total: number;
  /** Oldest week first; each week Monday..Sunday. */
  weeks: { start: string; days: { date: string; count: number; future: boolean }[]; count: number }[];
}

export function consistency(dates: string[], today: string, weeksShown = 4, goal = WEEKLY_GOAL): Consistency {
  const perDay = new Map<string, number>();
  for (const d of dates) perDay.set(d, (perDay.get(d) ?? 0) + 1);
  const perWeek = new Map<string, number>();
  for (const d of dates) perWeek.set(weekStart(d), (perWeek.get(weekStart(d)) ?? 0) + 1);

  const current = weekStart(today);
  const thisWeek = perWeek.get(current) ?? 0;

  // This week counts toward the streak once the goal is hit; an unfinished
  // week doesn't break it.
  let weekStreak = thisWeek >= goal ? 1 : 0;
  let w = addDays(current, -7);
  while ((perWeek.get(w) ?? 0) >= goal) {
    weekStreak++;
    w = addDays(w, -7);
  }

  const weeks = Array.from({ length: weeksShown }, (_, i) => {
    const start = addDays(current, -7 * (weeksShown - 1 - i));
    const days = Array.from({ length: 7 }, (_, j) => {
      const date = addDays(start, j);
      return { date, count: perDay.get(date) ?? 0, future: date > today };
    });
    return { start, days, count: perWeek.get(start) ?? 0 };
  });

  return { thisWeek, weekStreak, total: dates.length, weeks };
}
