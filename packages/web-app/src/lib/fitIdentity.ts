// Gary's identity statement for the Fit Today screen. Edit freely.
export const FIT_IDENTITY_STATEMENT =
  "My body is my project. I'm building it block by block, to suit it how I want it.";
export const FIT_IDENTITY_DEFAULT_LINE = "Next phase of the build. Let's go.";
export const FIT_IDENTITY_FLAT_DAY_LINE =
  "The project doesn't need a perfect day. It needs the next brick. Start with the first warm-up set.";
export const FIT_IDENTITY_DELOAD_LINE = "Deload week. Recovery is part of the build.";
export const FIT_IDENTITY_BENCHMARK_LINE = "Benchmark week. Time to see what this phase built.";
export const FIT_IDENTITY_LAST_WEEK_LINE = "What did this phase teach me, and how do I want the next one built?";

export function fitIdentitySubline(phase: string | null, isLastWeek: boolean): string {
  if (isLastWeek) return FIT_IDENTITY_LAST_WEEK_LINE;
  if (phase === "deload") return FIT_IDENTITY_DELOAD_LINE;
  if (phase === "benchmark") return FIT_IDENTITY_BENCHMARK_LINE;
  return FIT_IDENTITY_DEFAULT_LINE;
}
