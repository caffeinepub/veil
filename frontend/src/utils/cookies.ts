/**
 * Cookie utility for auth token management.
 * Note: HttpOnly cannot be set via document.cookie (requires server-side Set-Cookie header).
 * We set Secure and SameSite=Strict for client-accessible cookies.
 */

const AUTH_COOKIE_NAME = 'auth_token';
const COOKIE_EXPIRY_DAYS = 7;

export function setAuthCookie(token: string): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${secure}`;
}

export function getAuthCookie(): string | null {
  const name = AUTH_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const parts = decodedCookie.split(';');
  for (let i = 0; i < parts.length; i++) {
    let c = parts[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function clearAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}
