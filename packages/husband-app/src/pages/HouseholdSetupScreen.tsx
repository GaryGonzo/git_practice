import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHousehold } from "../lib/HouseholdProvider";
import { useAuth } from "../lib/AuthProvider";

export function HouseholdSetupScreen() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { household, createHousehold, joinHousehold } = useHousehold();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (household) {
    navigate("/app", { replace: true });
    return null;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createHousehold(name);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await joinHousehold(code);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl">Welcome 👋</h1>
      <p className="font-body mt-1 text-sm text-neutral-600">
        Set up your household to start sending requests, tasks, and points back and forth.
      </p>

      {mode === "choose" && (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="font-display w-full rounded-xl border border-neutral-200 bg-white p-4 text-left"
          >
            <p className="text-base font-semibold">Start a new household</p>
            <p className="font-body mt-0.5 text-sm text-neutral-500">
              You'll get an invite code to share with your partner.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className="font-display w-full rounded-xl border border-neutral-200 bg-white p-4 text-left"
          >
            <p className="text-base font-semibold">Join with an invite code</p>
            <p className="font-body mt-0.5 text-sm text-neutral-500">Your partner already set one up.</p>
          </button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Household name
            </label>
            <input
              type="text"
              required
              placeholder="The Smiths"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create household"}
          </button>
          <button type="button" onClick={() => setMode("choose")} className="font-body block w-full text-center text-sm text-neutral-500">
            Back
          </button>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <div>
            <label className="font-display text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Invite code
            </label>
            <input
              type="text"
              required
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-body mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 uppercase tracking-widest"
            />
          </div>
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="font-display bg-brand w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Joining…" : "Join household"}
          </button>
          <button type="button" onClick={() => setMode("choose")} className="font-body block w-full text-center text-sm text-neutral-500">
            Back
          </button>
        </form>
      )}

      <button type="button" onClick={() => signOut()} className="font-body mt-8 block w-full text-center text-sm text-neutral-400 underline">
        Sign out
      </button>
    </div>
  );
}
