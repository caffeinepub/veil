import React from 'react';
import { Navigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ShieldOff } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isInitializing, isAdmin, role } = useAuth();

  if (isInitializing || (isAuthenticated && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <ShieldOff className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-serif font-semibold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin dashboard. This area is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
