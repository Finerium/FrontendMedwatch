/**
 * Runtime API base resolution for the dual-target frontend.
 *
 * In the Vercel deployment the static export is served from the same
 * origin as the Next.js API routes that proxy to Cloud Run, so the base
 * URL is the empty string and every fetch uses a relative path like
 * `/api/auth/me`.
 *
 * In the Electron desktop variant the static export is loaded via
 * file:// and the bundled Flask backend listens on a dynamic loopback
 * port. The Electron preload exposes that port on
 * `window.__MEDWATCH_BACKEND_PORT__` via `contextBridge`, and this
 * module reads it at call time so the same `fetch(apiUrl('/api/...'))`
 * call works in both environments.
 *
 * Key exports: `apiBase()` and `apiUrl(path)`.
 */

declare global {
  interface Window {
    __MEDWATCH_BACKEND_PORT__?: number;
  }
}

/**
 * localStorage key under which the backend-issued JWT is persisted so the
 * session survives a reload of the desktop static export.
 */
const TOKEN_KEY = "medwatch_token";

/**
 * In-memory cache of the current token. Kept in sync with localStorage so
 * reads on every API call avoid touching storage and so the token is still
 * available during the brief window before the store hydrates.
 */
let tokenCache: string | null = null;

/**
 * Read the current auth token.
 *
 * Returns the in-memory copy when present, otherwise falls back to
 * localStorage (guarded for SSR / static export where `window` is absent).
 *
 * @returns The JWT string, or null when logged out.
 */
export function getToken(): string | null {
  if (tokenCache) return tokenCache;
  if (typeof window === "undefined") return null;
  try {
    tokenCache = window.localStorage.getItem(TOKEN_KEY);
  } catch {
    tokenCache = null;
  }
  return tokenCache;
}

/**
 * Persist the auth token to memory and localStorage.
 *
 * @param token - The JWT string returned by POST /api/auth/login.
 */
export function setToken(token: string): void {
  tokenCache = token;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage may be unavailable; the in-memory copy still works this session
  }
}

/**
 * Clear the auth token from memory and localStorage (logged-out state).
 */
export function clearToken(): void {
  tokenCache = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

/**
 * Build the request headers that carry the bearer token when a token
 * exists. Merges any caller-supplied headers (for example Content-Type).
 *
 * @param extra - Optional base headers to merge the Authorization onto.
 * @returns A headers object ready to pass to `fetch`.
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Resolve the API base URL at call time.
 *
 * Returns a fully qualified `http://127.0.0.1:<port>` URL when the
 * Electron preload has injected `window.__MEDWATCH_BACKEND_PORT__`,
 * otherwise returns the empty string so relative paths continue to hit
 * the same-origin Vercel proxy.
 *
 * @returns Base URL string (possibly empty).
 */
export function apiBase(): string {
  if (typeof window !== "undefined" && window.__MEDWATCH_BACKEND_PORT__) {
    return `http://127.0.0.1:${window.__MEDWATCH_BACKEND_PORT__}`;
  }
  // Web (Vercel) mode: the build bakes the Cloud Run URL into
  // NEXT_PUBLIC_API_BASE so the static export reaches the backend
  // cross-origin. The backend CORS allowlist includes the Vercel origin and
  // the Bearer transport is unified across desktop and web, so the same
  // fetch(apiUrl('/api/...')) works in both. Empty string keeps relative
  // same-origin paths for `next dev` and the desktop Flask loopback (whose
  // renderer is served from the same origin as /api).
  return process.env.NEXT_PUBLIC_API_BASE || "";
}

/**
 * Join the API base URL with the given path.
 *
 * The path may start with `/` or not; either way the result is a single
 * concatenation with the resolved base. Use this every place a fetch
 * call would otherwise hardcode a leading `/api/...` so the request
 * lands on the correct backend in both Vercel and Electron mode.
 *
 * @param path - API path beginning with `/` (recommended) or not.
 * @returns Fully formed URL ready to pass to `fetch`.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${normalized}`;
}
