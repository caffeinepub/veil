import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, logout } = useAuth();
  const { data: profile } = useGetCallerUserProfile();

  const isAdmin = role === 'admin';

  const navLinks = [
    { label: 'Home', path: '/dashboard' },
    { label: 'My Posts', path: '/posts' },
    { label: 'Community', path: '/community' },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate({ to: isAuthenticated ? '/dashboard' : '/login' })}
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src="/assets/generated/veil-logo.dim_256x256.png"
            alt="Veil"
            className="w-7 h-7 rounded-md"
          />
          <span className="font-serif font-semibold text-lg text-foreground tracking-tight">
            Veil
          </span>
        </button>

        {/* Nav Links */}
        {isAuthenticated && profile && (
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate({ to: link.path })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && profile && (
            <span className="hidden sm:block text-sm text-muted-foreground font-medium truncate max-w-[120px]">
              {profile.pseudonym}
            </span>
          )}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
