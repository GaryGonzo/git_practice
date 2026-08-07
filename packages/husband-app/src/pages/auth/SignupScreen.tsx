import { useState } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import type { HouseholdRole } from "../../types";

const ROLE_COPY: Record<HouseholdRole, { heading: string; emoji: string }> = {
  wife: { heading: "Create your wife account", emoji: "👰" },
  husband: { heading: "Create your husband account", emoji: "🤵" },
};

export function SignupScreen() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  if (role !== "wife" && role !== "husband") {
    return <Navigate to="/signup" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role },
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

    if (data.session) {
      navigate("/app");
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-3xl">Check your email</h1>
        <p className="font-body mt-3 text-sm text-neutral-600">
          We sent a confirmation link to <span className="font-semibold text-neutral-900">{email}</span>. Click it
          to verify your account, then come back and log in.
        </p>
        <Link to="/login" className="font-display bg-brand mt-6 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl">
        {ROLE_COPY[role].emoji} {ROLE_COPY[role].heading}
      </h1>
      <p className="font-body mt-1 text-sm text-neutral-600">
        Not the {role === "wife" ? "husband" : "wife"}?{" "}
        <Link to={`/signup/${role === "wife" ? "husband" : "wife"}`} className="text-brand underline">
          Switch account type
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Your name
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
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
          <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
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

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
