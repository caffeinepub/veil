import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsAdmin } from '../hooks/useQueries';
import AdminDashboard from '../components/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin, isLoading } = useIsAdmin();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <Shield size={40} className="text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-serif text-2xl text-foreground mb-2">Access Restricted</h2>
        <p className="text-muted-foreground font-sans text-sm">
          This area is for moderators only.
        </p>
      </div>
    );
  }

  return <AdminDashboard />;
}
