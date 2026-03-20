import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldOff } from "lucide-react";
import { useEffect } from "react";
import AdminDashboard from "../components/AdminDashboard";
import { useAuth } from "../hooks/useAuth";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, role } = useAuth();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  useEffect(() => {
    if (profileFetched && !profile && isAuthenticated) {
      navigate({ to: "/signup" });
    }
  }, [profileFetched, profile, isAuthenticated, navigate]);

  if (isInitializing || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ShieldOff className="w-7 h-7 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view this page. Admin access is
            required.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/community" })}
            className="text-sm text-primary underline hover:no-underline"
          >
            Go to Community Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <AdminDashboard />
      </div>
    </div>
  );
}
