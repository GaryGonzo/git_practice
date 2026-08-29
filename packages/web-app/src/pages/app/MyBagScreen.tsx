import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BagEntry } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { getMyBag, setBagClubYardage } from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BagRow({ profileId, entry }: { profileId: string; entry: BagEntry }) {
  const [value, setValue] = useState(entry.yardage === null ? "" : String(entry.yardage));
  const [saved, setSaved] = useState(false);

  async function handleBlur() {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : Number(trimmed);
    if (num !== null && !Number.isFinite(num)) return;
    await setBagClubYardage(profileId, entry.club, num);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  // A club with logged Club Gapping swings shows that live average instead
  // of a manual field -- it's the more accurate number, and it's what
  // keeps the two tools in sync rather than drifting apart.
  if (entry.source === "gapping") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-0">
        <div>
          <p className="font-label text-sm font-semibold text-neutral-700">{entry.club}</p>
          <p className="font-body text-xs text-neutral-400">
            {entry.sampleCount} swing{entry.sampleCount === 1 ? "" : "s"} logged in{" "}
            <Link to="/app/tools/gapping" className="text-brand underline">
              Club Gapping
            </Link>
          </p>
        </div>
        <span className="font-label text-sm font-semibold text-neutral-700">{entry.yardage} yds</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-0">
      <p className="font-label text-sm font-semibold text-neutral-700">{entry.club}</p>
      <div className="flex items-center gap-2">
        {saved && <span className="font-body text-xs text-neutral-400">Saved</span>}
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="yds"
          className="font-body w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-right text-sm"
        />
      </div>
    </div>
  );
}

export function MyBagScreen() {
  const { profile } = useAuth();
  const [bag, setBag] = useState<BagEntry[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    getMyBag(profile.id).then(setBag);
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/profile" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">My Bag</h1>
      <p className="font-body text-sm text-neutral-500">
        Your typical yardage per club. When a Golfable calls for a distance, we'll suggest the club that fits.
        Clubs you've logged in{" "}
        <Link to="/app/tools/gapping" className="text-brand underline">
          Club Gapping
        </Link>{" "}
        show that measured average automatically -- for everything else, enter your best estimate below.
      </p>

      {bag === null ? (
        <p className="font-body mt-6 text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white px-4">
          {bag.map((entry) => (
            <BagRow key={entry.club} profileId={profile.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
