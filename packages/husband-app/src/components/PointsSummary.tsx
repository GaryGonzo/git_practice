import type { Profile } from "../types";

interface Props {
  members: Profile[];
  totals: Map<string, number>;
  meId: string;
}

export function PointsSummary({ members, totals, meId }: Props) {
  const max = Math.max(1, ...members.map((m) => totals.get(m.id) ?? 0));

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const points = totals.get(member.id) ?? 0;
        const width = Math.max(6, Math.round((points / max) * 100));
        return (
          <div key={member.id}>
            <div className="flex items-baseline justify-between">
              <p className="font-display text-sm font-semibold">
                {member.avatar_emoji} {member.id === meId ? "You" : member.display_name}
              </p>
              <p className="font-display text-sm font-semibold text-brand">{points} pts</p>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
