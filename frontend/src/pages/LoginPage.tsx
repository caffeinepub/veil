import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile, isFetched, isLoading: profileLoading } = useGetCallerUserProfile();

  useEffect(() => {
    if (isAuthenticated && isFetched) {
      if (profile) {
        navigate({ to: '/' });
      } else {
        navigate({ to: '/signup' });
      }
    }
  }, [isAuthenticated, profile, isFetched, navigate]);

  const handleLogin = async () => {
    if (isAuthenticated) {
      await clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const isLoading = loginStatus === 'logging-in' || isInitializing || (isAuthenticated && profileLoading);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="Veil"
            className="w-20 h-20 rounded-2xl object-cover shadow-sm"
          />
        </div>

        <h1 className="font-serif text-3xl font-medium text-foreground mb-3">
          Welcome to Veil
        </h1>
        <p className="text-muted-foreground font-sans text-base leading-relaxed mb-10 max-w-xs mx-auto">
          A private space to hold your honest moments. Invite-only. Pseudonymous. Yours.
        </p>

        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full h-12 font-sans text-base rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {loginStatus === 'logging-in' ? 'Connecting...' : 'Loading...'}
            </span>
          ) : (
            'Enter with your identity'
          )}
        </Button>

        <p className="mt-6 text-xs text-muted-foreground font-sans leading-relaxed">
          Veil is invite-only. You'll need a valid invite code to join.
        </p>
      </div>
    </div>
  );
}
