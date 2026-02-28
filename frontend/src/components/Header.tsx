import { useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetMyProfile, useIsAdmin } from '../hooks/useQueries';
import { LogOut, Shield, BookOpen, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetMyProfile();
  const { data: isAdmin } = useIsAdmin();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const navLinks = [
    { to: '/dashboard', label: 'Home', icon: <LayoutDashboard size={15} /> },
    { to: '/posts', label: 'My Posts', icon: <BookOpen size={15} /> },
    { to: '/community', label: 'Community', icon: <Users size={15} /> },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: <Shield size={15} /> }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate({ to: isAuthenticated ? '/dashboard' : '/login' })}
          className="flex items-center gap-2 shrink-0"
        >
          <img src="/assets/generated/veil-logo.dim_256x256.png" alt="Veil" className="h-7 w-7 rounded-md" />
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">Veil</span>
        </button>

        {/* Nav links */}
        {isAuthenticated && (
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.to}
                onClick={() => navigate({ to: link.to })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated && profile && (
            <span className="hidden sm:block text-sm text-muted-foreground font-medium">
              {profile.pseudonym}
            </span>
          )}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
