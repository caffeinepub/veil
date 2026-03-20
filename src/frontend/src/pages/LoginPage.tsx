import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  useEffect(() => {
    if (!isAuthenticated || profileLoading || isInitializing || !isFetched)
      return;
    if (profile !== null && profile !== undefined) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/signup" });
    }
  }, [
    isAuthenticated,
    profile,
    profileLoading,
    isInitializing,
    isFetched,
    navigate,
  ]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (e: unknown) {
      console.error("Login error:", e);
    }
  };

  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      {/* Center content */}
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo */}
          <img
            src="/assets/ChatGPT Image Mar 2, 2026, 07_20_55 PM-2.png"
            alt="Veil logo"
            className="h-14 w-auto object-contain rounded-xl p-0 m-0 mx-auto"
          />
          <h1 className="text-3xl font-semibold tracking-wide text-foreground">
            Veil
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A quiet space for honest expression. Sign in to continue.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleLogin}
          disabled={isLoggingIn || isInitializing}
          className="w-full"
        >
          {isLoggingIn || isInitializing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {isLoggingIn ? "Signing in…" : "Sign In"}
        </Button>
      </div>
    </main>
  );
}
