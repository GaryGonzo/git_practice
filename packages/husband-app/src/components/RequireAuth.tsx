import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
