/**
 * Zustand auth store. Owns the in-memory copy of the current user identity
 * and exposes login/logout/fetchMe so any client component can react to
 * session changes. The actual token lives in an httpOnly cookie set by the
 * Vercel proxy, so this store never holds raw credentials.
 *
 * Key exports: `useAuthStore`, the `Role` and `User` types, and the
 * `landingForRole` helper used by the login redirect.
 */
import { create } from "zustand";

/** The three demo roles the system supports. */
export type Role = "tenaga_kesehatan" | "masyarakat" | "admin";

/** Public user identity shape returned by /api/auth/me. */
export type User = {
  username: string;
  role: Role;
  name: string;
};

type AuthStore = {
  user: User | null;
  isLoading: boolean;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

/**
 * Global Zustand auth store. `hydrated` becomes true after the first call
 * to `fetchMe` so the shell can avoid flashing protected routes before the
 * cookie is verified.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  hydrated: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        return { ok: false, error: body.error || "Login gagal" };
      }
      const data = await r.json();
      set({ user: data.user, isLoading: false, hydrated: true });
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ user: null, hydrated: true });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const r = await fetch("/api/auth/me");
      if (r.ok) {
        const user = await r.json();
        set({ user, hydrated: true });
      } else {
        set({ user: null, hydrated: true });
      }
    } catch {
      set({ user: null, hydrated: true });
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
