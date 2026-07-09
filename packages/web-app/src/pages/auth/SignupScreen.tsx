import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HANDICAP_TIERS, TIER_INFO, type HandicapTier } from "@golfable/shared";
import { supabase } from "../../lib/supabaseClient";

export function SignupScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tier, setTier] = useState<HandicapTier>("mid");
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          tier,
          weekly_goal: weeklyGoal,
          marketing_opt_in: marketingOptIn,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setSubmitting(false);
    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes("already registered")
          ? "An account with that email already exists -- try logging in instead."
          : signUpError.message
      );
      return;
    }

    // A session comes back immediately only if the project has email
    // confirmations turned off. Otherwise there's no session yet -- the
    // member has to click the link we just emailed them before they can log
    // in, so show that instead of bouncing them into a signed-out /app.
    if (data.session) {
      navigate("/app");
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-wide">Check your email</h1>
        <p className="font-body mt-3 text-sm text-neutral-600">
          We sent a confirmation link to <span className="font-semibold text-neutral-900">{email}</span>. Click it
          to verify your account, then come back and log in.
        </p>
        <Link
          to="/login"
          className="font-label bg-brand mt-6 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl tracking-wide">Create your account</h1>
      <p className="font-body mt-1 text-sm text-neutral-600">Free during early access.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              First name
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Last name
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
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

        <label className="font-body flex items-start gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5"
          />
          Send me updates, alerts, and occasional emails from Golfable
        </label>

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
