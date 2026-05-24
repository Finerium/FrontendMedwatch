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
  return "";
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
