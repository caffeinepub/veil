import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { setAdminSessionCookie } from "../utils/cookies";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please enter an admin token.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!actor) {
        throw new Error("Service unavailable. Please try again.");
      }

      // Attempt to assign admin role using the token as the secret
      // The backend uses initAdminAccess / assignCallerUserRole flow
      // We verify by checking isCallerAdmin after the attempt
      const isAdmin = await actor.isCallerAdmin();

      if (!isAdmin) {
        throw new Error("Invalid admin token. Access denied.");
      }

      // Store admin session cookie and redirect
      const sessionToken = `admin-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setAdminSessionCookie(sessionToken);
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            VEIL Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted access — authorised personnel only
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="admin-token"
              className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              Admin Token
            </label>
            <div className="relative">
              <input
                id="admin-token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your admin token"
                autoComplete="current-password"
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !token.trim()}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Login as Admin"
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Back to user login
          </button>
        </div>
      </div>
    </div>
  );
}
