import { useInternetIdentity } from './useInternetIdentity';
import { useIsCallerAdmin } from './useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { clearAuthCookie } from '../utils/cookies';

export interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  userId: string | null;
  role: 'admin' | 'user' | null;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const ANONYMOUS_PRINCIPAL = '2vxsx-fae';
  const isAuthenticated =
    !!identity && identity.getPrincipal().toText() !== ANONYMOUS_PRINCIPAL;

  const userId = isAuthenticated ? identity!.getPrincipal().toText() : null;

  const { data: isAdmin } = useIsCallerAdmin();
  const role: 'admin' | 'user' | null = !isAuthenticated
    ? null
    : isAdmin
    ? 'admin'
    : 'user';

  const logout = async () => {
    clearAuthCookie();
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  return {
    isAuthenticated,
    isInitializing: isInitializing ?? false,
    userId,
    role,
    logout,
  };
}
