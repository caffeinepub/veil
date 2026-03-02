import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useIsCallerAdmin } from './useQueries';
import { clearAuthCookie } from '../utils/cookies';

export function useAuth() {
  const { identity, clear, isInitializing, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const userId = identity?.getPrincipal().toString() ?? null;
  const role = isAuthenticated ? (isAdmin ? 'admin' : 'user') : null;

  const logout = async () => {
    clearAuthCookie();
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  return {
    isAuthenticated,
    isInitializing,
    userId,
    identity,
    role,
    isAdmin: !!isAdmin,
    logout,
    loginStatus,
  };
}
