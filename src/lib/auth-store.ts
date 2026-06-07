/**
 * Zustand auth store. Owns the in-memory copy of the current user identity
 * and exposes login/logout/fetchMe so any client component can react to
 * session changes.
 *
 * The backend authenticates with a bearer token. On login the token is
 * captured and persisted to localStorage via the helpers in `api-base`,
 * then attached as `Authorization: Bearer <token>` to every API call. On
 * reload the store hydrates the token from localStorage and revalidates it
 * with `fetchMe`; a 401 clears both the token and the user.
 *
 * Key exports: `useAuthStore`, the `Role` and `User` types, and the
 * `landingForRole` helper used by the login redirect.
 */
import { create } from "zustand";
import { apiUrl, authHeaders, setToken, clearToken, getToken } from "./api-base";

/** The three demo roles the system supports. */
export type Role = "tenaga_kesehatan" | "masyarakat" | "admin";

/** Public user identity shape returned by /api/auth/me. */
export type User = {
  username: string;
  role: Role;
  name: string;
};

/** Payload accepted by POST /api/auth/register. The server only allows the
 * two self-service roles; admin accounts are seeded, never registered. */
export type RegisterInput = {
  username: string;
  password: string;
  name: string;
  role: "tenaga_kesehatan" | "masyarakat";
  phone?: string;
};

type AuthStore = {
  user: User | null;
  isLoading: boolean;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

/**
 * Global Zustand auth store. `hydrated` becomes true after the first call
 * to `fetchMe` so the shell can avoid flashing protected routes before the
 * token is verified.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  hydrated: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const r = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        return { ok: false, error: body.error || "Login gagal" };
      }
      const data = await r.json();
      if (typeof data?.token === "string" && data.token) {
        setToken(data.token);
      }
      set({ user: data.user, isLoading: false, hydrated: true });
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const r = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        return { ok: false, error: body.error || "Pendaftaran gagal" };
      }
      const data = await r.json();
      if (typeof data?.token === "string" && data.token) {
        setToken(data.token);
      }
      set({ user: data.user, isLoading: false, hydrated: true });
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
    clearToken();
    set({ user: null, hydrated: true });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    // No token means there is nothing to validate; settle in logged-out
    // state without a network round trip.
    if (!getToken()) {
      set({ user: null, hydrated: true, isLoading: false });
      return;
    }
    try {
      const r = await fetch(apiUrl("/api/auth/me"), { headers: authHeaders() });
      if (r.ok) {
        const user = await r.json();
        set({ user, hydrated: true });
      } else if (r.status === 401) {
        // Token is genuinely invalid: clear it.
        clearToken();
        set({ user: null, hydrated: true });
      } else {
        // Server error (5xx) but token may still be valid: keep it.
        set({ hydrated: true });
      }
    } catch {
      // Transient network failure (not a 401): keep the token so a later
      // retry recovers the session instead of forcing a logout. The local
      // desktop backend is always reachable, so this only guards the web
      // app against a flaky connection to Cloud Run.
      set({ hydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },
}));

/**
 * Map a role to the page the user should land on after a successful login.
 * Mirrors the same routing decision in `src/proxy.ts` so middleware and
 * client agree on where each role belongs.
 *
 * @param role - Role string from the JWT/me response.
 * @returns Absolute path under the Next.js app router.
 */
export function landingForRole(role: Role): string {
  if (role === "masyarakat") return "/drug-search";
  if (role === "admin") return "/admin/dashboard";
  return "/dashboard";
}
