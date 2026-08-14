import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CATEGORY_INFO, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../lib/AuthProvider";
import { getChallengeByCode, type Challenge } from "../lib/golfableApi";

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

export function JoinChallengeScreen() {
  const { code } = useParams();
  const { session } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined);

  useEffect(() => {
    if (!code) return;
    getChallengeByCode(code).then(setChallenge);
  }, [code]);

  if (challenge === undefined) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }

  if (challenge === null) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-wide">Invite Not Found</h1>
        <p className="font-body mt-3 text-sm text-neutral-600">
          This challenge code isn't valid, or the challenge has been removed.
        </p>
        <Link to="/" className="font-label text-brand mt-6 inline-block text-sm font-semibold underline">
          Go to Golfable
        </Link>
      </div>
    );
  }

  const nextPath = `/app/challenges/${challenge.id}`;

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <div
        className={`font-display mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl text-white ${CATEGORY_BG[challenge.drill.category]}`}
      >
        {CATEGORY_INFO[challenge.drill.category].badge}
      </div>
      <p className="font-label mt-4 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
        You've Been Challenged
      </p>
      <h1 className="font-display mt-1 text-3xl tracking-wide">
        {challenge.creatorFirstName} challenged you to {challenge.drill.name}
      </h1>
      <p className="font-body mt-1 text-sm text-neutral-500">{CATEGORY_INFO[challenge.drill.category].label}</p>

      {(challenge.wager || challenge.note) && (
        <div className="mt-4 space-y-2 text-left">
          {challenge.wager && (
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                Wager <span className="font-body normal-case text-neutral-400">(for fun -- no real money)</span>
              </p>
              <p className="font-body mt-0.5 text-sm text-neutral-700">{challenge.wager}</p>
            </div>
          )}
          {challenge.note && (
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Note</p>
              <p className="font-body mt-0.5 text-sm text-neutral-700">{challenge.note}</p>
            </div>
          )}
        </div>
      )}

      {session ? (
        <Link
          to={nextPath}
          className="font-label bg-brand mt-6 block w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
        >
          View & Join Challenge
        </Link>
      ) : (
        <>
          <Link
            to={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="font-label bg-brand mt-6 block w-full rounded-md px-4 py-3 text-sm font-semibold text-white"
          >
            Sign Up to Join
          </Link>
          <p className="font-body mt-3 text-sm text-neutral-500">
            Already have an account?{" "}
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="text-brand underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
