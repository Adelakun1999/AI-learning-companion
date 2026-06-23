// src/lib/auth.ts
//
// WHY THIS FILE EXISTS:
//   After login, the backend gives us a JWT token. We need to:
//     1. Store it somewhere that survives page refreshes
//     2. Attach it to every subsequent API request
//     3. Remove it on logout
//
//   We use localStorage (browser storage that persists across sessions).
//   This is a simple choice for now — for production-grade security
//   you'd consider httpOnly cookies to protect against XSS, but
//   localStorage is the standard starting point and keeps things simple.

const TOKEN_KEY = "learning_companion_token";
const USER_KEY = "learning_companion_user";

/**
 * Save the JWT token after a successful login/register.
 * The "typeof window === undefined" check guards against running
 * during Next.js's server-side build step (getStaticProps, etc.),
 * where 'window' and 'localStorage' don't exist.
 */
export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Read the stored token. Returns null if not logged in.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove the token — used on logout.
 */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Quick boolean check — are we logged in?
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Cache the user object alongside the token so we don't have to
 * refetch /auth/me on every page load. (We didn't build a /me
 * endpoint yet — this just avoids an extra round trip for now.)
 */
export function saveUser(user: object): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}
