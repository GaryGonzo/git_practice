import { TIER_INFO } from "@golfable/shared";
import { MOCK_USER } from "../../mock/todaysDrill";

export function ProfileScreen() {
  const tierInfo = TIER_INFO[MOCK_USER.tier];

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Profile</h1>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Username
        </p>
        <p className="font-display text-xl">{MOCK_USER.username}</p>
      </div>
      <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Handicap tier
        </p>
        <p className="font-display text-xl">{tierInfo.label}</p>
      </div>
      <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Weekly goal
        </p>
        <p className="font-display text-xl">{MOCK_USER.weeklyGoal} Golfables / week</p>
      </div>
      <div className="mt-6 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="font-label text-sm font-semibold text-neutral-400">
          Editing, subscription status, and sign-out land here once auth is wired up
        </p>
      </div>
    </div>
  );
}
