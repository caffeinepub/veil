import { Navigate } from "@tanstack/react-router";
import { Loader2, ShieldOff } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { getAdminSessionCookie } from "../utils/cookies";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isInitializing, role } = useAuth();

  // Fast path: if admin session cookie exists, grant access immediately
  const hasAdminSession = !!getAdminSessionCookie();
  if (hasAdminSession) {
    return <>{children}</>;
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" />;
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldOff className="h-10 w-10 text-muted-foreground" />
        <h2 className="font-serif text-2xl font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
