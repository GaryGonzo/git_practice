import { Navigate } from "react-router-dom";
import { useHousehold } from "../lib/HouseholdProvider";

export function RequireHousehold({ children }: { children: React.ReactNode }) {
  const { household, loading } = useHousehold();

  if (loading) {
    return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  }
  if (!household) {
    return <Navigate to="/app/setup" replace />;
  }
  return <>{children}</>;
}
