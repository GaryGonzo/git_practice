import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORY_INFO, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { getChallengeByCode, getMyChallenges, type ChallengeSummary } from "../../lib/golfableApi";

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChallengesScreen() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    getMyChallenges(profile.id).then((result) => {
      setChallenges(result);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setJoinError(null);
    setJoining(true);
    const challenge = await getChallengeByCode(code);
    setJoining(false);
    if (!challenge) {
      setJoinError("No challenge found with that code.");
      return;
    }
    navigate(`/app/challenges/${challenge.id}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Challenges</h1>
      <p className="font-body text-sm text-neutral-500">Invite friends on the range to compete on a drill.</p>

      <Link
        to="/app/challenges/new"
        className="font-label bg-brand mt-6 block w-full rounded-md px-4 py-3 text-center text-sm font-semibold text-white"
      >
        Create a Challenge
      </Link>

      <form onSubmit={handleJoin} className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Join with a Code
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDE"
            className="font-display flex-1 rounded-md border border-neutral-300 px-3 py-2 text-center text-lg tracking-widest uppercase"
            maxLength={5}
          />
          <button
            type="submit"
            disabled={joining || !code.trim()}
            className="font-label bg-brand rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {joining ? "…" : "Join"}
          </button>
        </div>
        {joinError && <p className="font-body mt-2 text-sm text-red-600">{joinError}</p>}
      </form>

      <div className="mt-6">
        <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Your Challenges
        </h2>
        {loading ? (
          <p className="font-body text-sm text-neutral-500">Loading…</p>
        ) : challenges.length === 0 ? (
          <p className="font-body text-sm text-neutral-500">No challenges yet -- create one or join with a code.</p>
        ) : (
          <div className="space-y-2">
            {challenges.map((c) => (
              <Link
                key={c.id}
                to={`/app/challenges/${c.id}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 active:bg-neutral-50"
              >
                <div
                  className={`font-display flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm text-white ${CATEGORY_BG[c.category]}`}
                >
                  {CATEGORY_INFO[c.category].badge}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label truncate text-sm font-semibold">{c.drillName}</p>
                  <p className="font-body text-xs text-neutral-500">
                    {c.participantCount} player{c.participantCount === 1 ? "" : "s"} · {formatDate(c.createdAt)}
                  </p>
                </div>
                <span className="font-label flex-none rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-600">
                  {c.myScore === null ? "Waiting" : c.myScore}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
