import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HANDICAP_TIERS, TIER_INFO, type HandicapTier } from "@golfable/shared";
import { supabase } from "../../lib/supabaseClient";

export function SignupScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [tier, setTier] = useState<HandicapTier>("mid");
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, tier, weekly_goal: weeklyGoal } },
    });

    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    navigate("/app");
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl tracking-wide">Create your account</h1>
      <p className="font-body mt-1 text-sm text-neutral-600">Free during early access.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Username
          </label>
          <input
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Handicap tier
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {HANDICAP_TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`font-label rounded-md border px-3 py-2 text-sm font-semibold ${
                  tier === t
                    ? "bg-brand border-brand text-white"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                {TIER_INFO[t].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Weekly goal
          </label>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWeeklyGoal(n)}
                className={`font-label rounded-md border px-2 py-2 text-sm font-semibold ${
                  weeklyGoal === n
                    ? "bg-brand border-brand text-white"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-label bg-brand w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="font-body mt-4 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="text-brand underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
