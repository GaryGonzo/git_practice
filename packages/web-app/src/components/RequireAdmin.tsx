import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";

// Client-side UX gate only -- the real security boundary is the
// admin_user_overview() RPC itself refusing to return data to non-admins.
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  if (!profile) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (!profile.is_admin) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
