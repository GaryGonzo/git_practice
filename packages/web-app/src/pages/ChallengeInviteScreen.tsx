import { Link, useLocation, useNavigate } from "react-router-dom";
import { DRILL_LIBRARY } from "@golfable/shared";
import { Dimples } from "../components/Dimples";
import { DrillScene } from "../components/DrillScene";
import { parseChallenge, savePendingChallenge } from "../lib/golfableInsights";

// Where a friend challenge link lands: who sent it, the drill, the score to
// beat. "Take the challenge" saves it on the phone and opens Golfable
// (via login or sign-up if needed), where it's waiting on the Practice tab.

export function ChallengeInviteScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const challenge = parseChallenge(location.search);
  const drill = challenge ? DRILL_LIBRARY.find((d) => d.id === challenge.drillId) : undefined;

  if (!challenge || !drill) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <Dimples pose="shrug" className="h-44 w-36" />
        <h1 className="font-display mt-4 text-4xl tracking-wide">That challenge link didn't work.</h1>
        <Link to="/" className="font-label text-brand mt-4 text-base font-bold underline">
          Go to Golfable
        </Link>
      </div>
    );
  }

  const lower = drill.score?.lower === true;

  return (
    <div className="bg-brand-dark min-h-screen text-white">
      <div className="mx-auto max-w-md px-5 pt-8 pb-12">
        <p className="font-label text-gold text-sm font-bold tracking-[0.2em]">GOLFABLE CHALLENGE</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[2.8rem] leading-[0.92] tracking-wide">{challenge.from} challenged you.</h1>
            <p className="font-body mt-2 text-base text-white/80">
              Beat <span className="text-gold font-display text-3xl align-middle">{challenge.score}</span> on <span className="font-semibold text-white">{drill.name}</span>
              {lower ? " (lower wins)" : ""}.
            </p>
          </div>
          <Dimples pose="think" onDark className="h-32 w-26 flex-none" />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white text-neutral-900">
          <DrillScene scene={drill.scene} />
          <div className="p-4">
            <p className="font-label text-sm font-semibold text-neutral-500">You need: {drill.equipment.join(", ")}</p>
            <ol className="mt-2 space-y-2">
              {drill.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display bg-brand/10 text-brand flex h-7 w-7 flex-none items-center justify-center rounded-full text-lg">{i + 1}</span>
                  <p className="font-body pt-0.5 text-[15px] leading-snug">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            savePendingChallenge(challenge);
            navigate("/app/golf");
          }}
          className="font-label bg-gold text-brand-dark mt-6 w-full rounded-xl px-4 py-4 text-lg font-bold shadow-lg shadow-black/20"
        >
          Take the challenge
        </button>
        <p className="font-body mt-3 text-center text-sm text-white/60">You'll sign in or create an account first.</p>
      </div>
    </div>
  );
}
