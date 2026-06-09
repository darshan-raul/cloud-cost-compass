import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "./useSession";
import { hasRole, type Role } from "@/lib/roles";

export function AuthGuard() {
  const { session, loading } = useSession();
  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleGuard({ min }: { min: Role }) {
  const { session, loading } = useSession();
  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!hasRole(session, min)) {
    return (
      <div className="p-8 text-sm text-destructive">
        Forbidden — this page requires the <code>{min}</code> role.
      </div>
    );
  }
  return <Outlet />;
}
