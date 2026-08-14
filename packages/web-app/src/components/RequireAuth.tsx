import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (!session) {
    // Preserve where they were headed (e.g. a challenge invite link) as a
    // query param, not router state -- state doesn't survive the fresh
    // page load someone gets from tapping a link in a text message.
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}
