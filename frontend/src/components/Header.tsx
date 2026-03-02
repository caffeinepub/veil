import { Link } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { isAuthenticated, isInitializing, role, logout } = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="max-w-3xl mx-auto px-5 h-12 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-base font-medium text-foreground hover:opacity-70 tracking-tight"
        >
          Veil
        </Link>

        {!isInitializing && (
          <nav className="flex items-center gap-5">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
                >
                  Write
                </Link>
                <Link
                  to="/posts"
                  className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
                >
                  Archive
                </Link>
                <Link
                  to="/community"
                  className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
                >
                  Community
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm text-foreground hover:opacity-70"
                >
                  Join
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
