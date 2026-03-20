import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  clearAdminSessionCookie,
  clearAuthCookie,
  getAdminSessionCookie,
} from "../utils/cookies";
import { useInternetIdentity } from "./useInternetIdentity";
import { useIsCurrentUserAdmin } from "./useQueries";

export function useAuth() {
  const { identity, clear, isInitializing, loginStatus } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check for admin session cookie first
  const adminSessionToken = getAdminSessionCookie();
  const hasAdminSession =
    !!adminSessionToken && adminSessionToken.trim() !== "";

  // Only run the Internet Identity admin check if no admin cookie is present
  const { data: isAdminViaII } = useIsCurrentUserAdmin();

  const isAuthenticated = hasAdminSession || !!identity;
  const userId =
    identity?.getPrincipal().toString() ??
    (hasAdminSession ? "admin-session" : null);

  // Role resolution: admin cookie takes priority, then II-based admin check
  const role = hasAdminSession
    ? "admin"
    : identity
      ? isAdminViaII
        ? "admin"
        : "user"
      : null;

  const logout = async () => {
    clearAuthCookie();
    clearAdminSessionCookie();
    await clear();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  return {
    isAuthenticated,
    isInitializing: hasAdminSession ? false : isInitializing,
    userId,
    identity,
    role,
    isAdmin: role === "admin",
    logout,
    loginStatus,
  };
}
