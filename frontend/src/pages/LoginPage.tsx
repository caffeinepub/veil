import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const [loginError, setLoginError] = useState<string | null>(null);

  const ANONYMOUS_PRINCIPAL = '2vxsx-fae';
  const isAuthenticated = !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();

  // Redirect after login + profile check
  useEffect(() => {
    if (!isAuthenticated) return;
    if (profileLoading) return;
    if (!profileFetched) return;

    if (userProfile) {
      navigate({ to: '/dashboard' });
    } else {
      navigate({ to: '/signup' });
    }
  }, [isAuthenticated, userProfile, profileLoading, profileFetched, navigate]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login();
    } catch (error: any) {
      if (error?.message === 'User is already authenticated') {
        // Already logged in, let the effect handle redirect
        return;
      }
      setLoginError(error?.message || 'Login failed. Please try again.');
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="Veil"
            className="w-20 h-20 rounded-2xl shadow-soft"
          />
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">Veil</h1>
            <p className="mt-2 text-muted-foreground text-base">
              A quiet space to share what you carry.
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in securely with your Internet Identity to continue.
            </p>
          </div>

          {loginError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive text-left">
              {loginError}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn || isAuthenticated}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            New here? Sign in to create your account — no invite code required.
          </p>
        </div>
      </div>
    </div>
  );
}
