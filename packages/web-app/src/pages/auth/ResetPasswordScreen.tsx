import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

// Landed on via the emailed reset link. supabase-js reads the recovery
// token out of the URL automatically and establishes a session, so by the
// time this mounts we just need to confirm one exists before letting the
// user set a new password.
export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate("/app");
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-wide">Link expired</h1>
        <p className="font-body mt-3 text-sm text-neutral-600">
          This password reset link is invalid or has expired. Request a new one below.
        </p>
        <Link
          to="/forgot-password"
          className="font-label text-brand mt-6 inline-block text-sm font-semibold underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl tracking-wide">Set a new password</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            New password
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
            Confirm password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-label bg-brand w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}
