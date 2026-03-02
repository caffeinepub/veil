import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/community' });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        await clear();
        queryClient.clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="VEIL"
            className="h-16 w-16 mx-auto rounded-2xl object-cover"
          />
          <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight">VEIL</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A private space for honest expression. Sign in to continue.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in with Internet Identity'
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Don't have an account?{' '}
            <a href="/signup" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Request access
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
