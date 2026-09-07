import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";

// Golfable Fit is visible to one person for now -- gated the same way
// RequireAdmin gates the admin dashboard, off a profiles flag rather than
// a hardcoded id so access can be widened later without a code change.
export function RequireFitAccess({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  if (!profile) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (!profile.fit_access) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
