/**
 * Thin fetch wrapper used by every client component to talk to the backend.
 *
 * In the Vercel deployment, calls go through the same-origin Vercel
 * catch-all proxy at /api/* so the browser never sees the real Cloud
 * Run hostname; the JWT lives in an httpOnly cookie set by
 * /api/auth/login.
 *
 * In the Electron desktop variant, `apiUrl` resolves the dynamic
 * loopback port the bundled Flask backend listens on, so the same
 * verb helpers reach the bundled Python server without code changes.
 *
 * Key exports: `ApiError`, the `api` verb helper, and `downloadBlob` for
 * binary PDF downloads.
 */
import { apiUrl } from "./api-base";

/**
 * Error thrown for any non-2xx HTTP response. Carries the parsed body so
 * callers can render server-supplied Indonesian error messages.
 */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Internal fetch dispatcher shared by every verb helper. Parses JSON
 * defensively (some endpoints return plain text) and throws ApiError on
 * non-ok responses.
 *
 * @param method - HTTP verb (GET, POST, PUT, DELETE).
 * @param path - Path under same-origin proxy; leading slash optional.
 * @param body - Optional JSON-serialisable payload for write verbs.
 * @returns Parsed response body cast to the caller-supplied type.
 */
async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  };
  const r = await fetch(apiUrl(path), init);
  const text = await r.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!r.ok) {
    const msg =
      (typeof parsed === "object" && parsed && "error" in parsed
        ? String((parsed as { error?: unknown }).error)
        : null) || `HTTP ${r.status}`;
    throw new ApiError(r.status, parsed, msg);
  }
  return parsed as T;
}

/**
 * Verb-keyed object so callers can write `api.get`, `api.post`, etc.
 * Each helper returns a Promise resolving to the typed response body.
 */
export const api = {
  get: <T>(path: string) => call<T>("GET", path),
  post: <T>(path: string, body?: unknown) => call<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => call<T>("PUT", path, body),
  delete: <T>(path: string) => call<T>("DELETE", path),
};

/**
 * POST a JSON body and stream the returned binary back to the user as a
 * file download. Used by the PDF export pages; the backend sets the
 * correct Content-Disposition but we still drive the click programmatically
 * so the file lands in the browser download folder.
 *
 * @param path - Proxy path that returns a binary stream (application/pdf).
 * @param body - JSON payload describing the report parameters.
 * @param filename - Filename suggested to the browser save dialog.
 */
export async function downloadBlob(path: string, body: unknown, filename: string): Promise<void> {
  const r = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new ApiError(r.status, txt, `Download failed: ${r.status}`);
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
