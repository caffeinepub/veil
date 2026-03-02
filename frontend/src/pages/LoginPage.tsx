import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    setError('');
    try {
      await login();
      navigate({ to: '/community' });
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl font-medium text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your private space.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 disabled:opacity-40"
          >
            {isLoggingIn ? 'Signing in…' : 'Sign in'}
          </button>

          {error && (
            <p className="text-sm text-muted-foreground text-center">{error}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-foreground hover:opacity-70">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
