import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-wide">Check your email</h1>
        <p className="font-body mt-3 text-sm text-neutral-600">
          If an account exists for {email}, a password reset link is on its way. Click it to set a new
          password.
        </p>
        <Link to="/login" className="font-label text-brand mt-6 inline-block text-sm font-semibold underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl tracking-wide">Reset your password</h1>
      <p className="font-body mt-1 text-sm text-neutral-600">
        Enter your email and we'll send you a link to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-label bg-brand w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="font-body mt-4 text-center text-sm text-neutral-500">
        <Link to="/login" className="text-brand underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
