import { useNavigate, useRouter } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile, useIsAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, Users, Shield } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const { data: profile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-3 group"
        >
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="Veil"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-serif text-xl font-medium text-foreground tracking-tight">
            Veil
          </span>
        </button>

        {/* Nav */}
        {isAuthenticated && profile && (
          <nav className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/my-posts' })}
              className="text-muted-foreground hover:text-foreground gap-2 font-sans text-sm"
            >
              <BookOpen size={15} />
              My Posts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/community' })}
              className="text-muted-foreground hover:text-foreground gap-2 font-sans text-sm"
            >
              <Users size={15} />
              Community
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/admin' })}
                className="text-muted-foreground hover:text-foreground gap-2 font-sans text-sm"
              >
                <Shield size={15} />
                Admin
              </Button>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && profile && (
            <span className="hidden sm:block text-sm text-muted-foreground font-sans">
              {profile.pseudonym}
            </span>
          )}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground gap-2 font-sans text-sm"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
