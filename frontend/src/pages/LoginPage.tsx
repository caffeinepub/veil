import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyProfile } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const { data: profile, isFetched: profileFetched, isLoading: profileLoading } = useGetMyProfile();
  const [loginError, setLoginError] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && profileFetched && !profileLoading) {
      if (profile) {
        navigate({ to: '/dashboard' });
      } else {
        navigate({ to: '/signup' });
      }
    }
  }, [isAuthenticated, profile, profileFetched, profileLoading, navigate]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      if (message !== 'User is already authenticated') {
        setLoginError(message);
      }
    }
  };

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="Veil"
            className="h-16 w-16 rounded-2xl shadow-md"
          />
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Veil</h1>
            <p className="text-muted-foreground text-sm mt-1">A safe space for honest expression</p>
          </div>
        </div>

        {/* Welcome copy */}
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>Share what you feel — anonymously, safely, and without judgment.</p>
          <p>Your identity stays hidden. Your words find their home.</p>
        </div>

        {/* Login button */}
        <div className="space-y-3">
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Connecting…
              </>
            ) : (
              'Enter with Internet Identity'
            )}
          </Button>

          {loginError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
              {loginError}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Invite-only community · Your privacy is protected
          </p>
        </div>
      </div>
    </div>
  );
}
