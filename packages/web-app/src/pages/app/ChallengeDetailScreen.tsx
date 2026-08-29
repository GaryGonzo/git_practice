import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CATEGORY_INFO, TIER_INFO, type SkillCategory } from "@golfable/shared";
import { useAuth } from "../../lib/AuthProvider";
import { supabase } from "../../lib/supabaseClient";
import {
  cancelChallenge,
  getChallenge,
  getChallengeParticipants,
  joinChallenge,
  submitChallengeScore,
  type Challenge,
  type ChallengeParticipant,
} from "../../lib/golfableApi";

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

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ChallengeDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreInput, setScoreInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const refreshParticipants = useCallback(async () => {
    if (!id) return;
    setParticipants(await getChallengeParticipants(id));
  }, [id]);

  useEffect(() => {
    if (!id || !profile) return;
    (async () => {
      setLoading(true);
      const found = await getChallenge(id);
      setChallenge(found);

      let currentParticipants = await getChallengeParticipants(id);
      if (found && !currentParticipants.some((p) => p.userId === profile.id)) {
        await joinChallenge(id, profile.id);
        currentParticipants = await getChallengeParticipants(id);
      }
      setParticipants(currentParticipants);
      setLoading(false);
    })();
  }, [id, profile]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`challenge-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenge_participants", filter: `challenge_id=eq.${id}` },
        refreshParticipants
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refreshParticipants]);

  if (!profile || !id) return null;
  if (loading) return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  if (!challenge) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-24 text-center">
        <p className="font-body text-neutral-600">Couldn't find that challenge.</p>
        <Link to="/app/challenges" className="font-label text-brand mt-2 inline-block text-sm font-semibold">
          Back to Challenges
        </Link>
      </div>
    );
  }

  const me = participants.find((p) => p.userId === profile.id);
  const allSubmitted = participants.length > 0 && participants.every((p) => p.score !== null);
  const topScore = participants[0]?.score ?? null;
  const winners = allSubmitted && topScore !== null ? participants.filter((p) => p.score === topScore) : [];

  async function handleCopy(field: "code" | "link") {
    const text = field === "code" ? challenge!.code : `${window.location.origin}/join/${challenge!.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // Clipboard access can fail silently (permissions, insecure context) --
      // the code/link is already visible on screen either way.
    }
  }

  async function handleCancel() {
    setCancelError(null);
    setCanceling(true);
    try {
      await cancelChallenge(id!);
      navigate("/app/challenges");
    } catch {
      setCancelError("Couldn't cancel that challenge -- try again.");
      setCanceling(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(scoreInput);
    if (!Number.isFinite(value) || value < 0 || value > challenge!.maxScore) {
      setError(`Enter a score between 0 and ${challenge!.maxScore}.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitChallengeScore(id!, profile!.id, value);
      await refreshParticipants();
    } catch {
      setError("Couldn't save your score -- try again.");
    }
    setSubmitting(false);
  }

  const drill = challenge.drill;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <Link to="/app/challenges" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Back
      </Link>

      {winners.length > 0 && (
        <div className="bg-gold/10 border-gold mt-4 rounded-lg border p-3 text-center">
          <p className="font-display text-xl tracking-wide">
            {winners.length === 1 ? `🏆 ${winners[0].firstName} wins!` : `🏆 It's a tie: ${winners.map((w) => w.firstName).join(" & ")}!`}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <div
          className={`font-display flex h-10 w-10 flex-none items-center justify-center rounded-full text-base text-white ${CATEGORY_BG[drill.category]}`}
        >
          {CATEGORY_INFO[drill.category].badge}
        </div>
        <div>
          <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {CATEGORY_INFO[drill.category].label}
          </p>
          <h1 className="font-display text-2xl tracking-wide">{drill.name}</h1>
        </div>
      </div>

      {(challenge.wager || challenge.note) && (
        <div className="mt-4 space-y-2">
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

      <button
        type="button"
        onClick={() => handleCopy("code")}
        className="font-label mt-4 flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
      >
        <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Invite Code</span>
        <span className="flex items-center gap-2">
          <span className="font-display text-xl tracking-widest">{challenge.code}</span>
          <CopyIcon className="h-4 w-4 text-neutral-400" />
        </span>
      </button>
      {copiedField === "code" && <p className="font-body mt-1 text-center text-xs text-neutral-500">Copied!</p>}

      <button
        type="button"
        onClick={() => handleCopy("link")}
        className="font-label mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600"
      >
        <CopyIcon className="h-4 w-4 text-neutral-400" />
        Copy Invite Link
      </button>
      {copiedField === "link" && <p className="font-body mt-1 text-center text-xs text-neutral-500">Copied!</p>}

      {challenge.creatorId === profile.id && !allSubmitted && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleCancel}
            disabled={canceling}
            className="font-label text-sm font-semibold text-red-600 underline disabled:opacity-60"
          >
            {canceling ? "Canceling…" : "Cancel Challenge"}
          </button>
          {cancelError && <p className="font-body mt-1 text-sm text-red-600">{cancelError}</p>}
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-label mb-2 text-sm font-semibold tracking-widest text-neutral-500 uppercase">
          Live Standings
        </h2>
        <div className="space-y-2">
          {participants.map((p, i) => {
            const isMe = p.userId === profile.id;
            const rank = i + 1;
            return (
              <div
                key={p.userId}
                className={`flex items-center gap-3 rounded-lg border p-3 ${isMe ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"}`}
              >
                <div
                  className={`font-display flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm ${
                    p.score !== null && rank <= 1 ? "bg-gold text-white" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {p.score !== null ? rank : "–"}
                </div>
                <p className="font-label min-w-0 flex-1 truncate text-sm font-semibold">
                  {p.firstName}
                  {isMe && <span className="text-brand"> (you)</span>}
                </p>
                <span className="font-label flex-none rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-600">
                  {p.score === null ? "Waiting…" : p.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">Setup</p>
        <p className="font-body mt-1 text-sm text-neutral-600">{drill.setup.description}</p>
        <p className="font-label mt-3 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          Your Target · {TIER_INFO[profile.tier].label}
        </p>
        <p className="font-display text-brand text-2xl">{drill.targets[profile.tier]}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="font-label text-xs font-semibold tracking-widest text-neutral-500 uppercase">
          {me?.score !== null && me?.score !== undefined ? "Update Your Score" : "Log Your Score"}
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={challenge.maxScore}
            placeholder={`0-${challenge.maxScore}`}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            className="font-body flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !scoreInput}
            className="font-label bg-brand rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "…" : "Submit"}
          </button>
        </div>
        {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
