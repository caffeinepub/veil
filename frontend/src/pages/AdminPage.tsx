import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyProfile, useIsAdmin } from '../hooks/useQueries';
import AdminDashboard from '../components/AdminDashboard';
import { Loader2, ShieldOff } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isFetched: profileFetched, isLoading: profileLoading } = useGetMyProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && profileFetched && !profileLoading && !profile) {
      navigate({ to: '/signup' });
    }
  }, [isAuthenticated, profile, profileFetched, profileLoading, navigate]);

  if (isInitializing || profileLoading || adminLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldOff size={40} className="text-muted-foreground/40" />
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
        </div>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return <AdminDashboard />;
}
