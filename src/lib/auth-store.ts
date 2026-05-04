import { create } from "zustand";

export type Role = "tenaga_kesehatan" | "masyarakat" | "admin";

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

export function landingForRole(role: Role): string {
  if (role === "masyarakat") return "/pasien/profile";
  if (role === "admin") return "/admin/dashboard";
  return "/";
}
