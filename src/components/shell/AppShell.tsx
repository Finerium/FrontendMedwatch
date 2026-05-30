/**
 * Top-level interactive shell that wraps every authenticated page.
 * Marked `"use client"` because it owns the theme provider, reads the
 * pathname for the login-page exception, and triggers the lazy auth
 * hydration that the rest of the app depends on.
 */
"use client";

import { ThemeProvider } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore, landingForRole, type Role } from "@/lib/auth-store";
import { AmbientWorld } from "@/components/ambient/AmbientWorld";
import { NavBar } from "./NavBar";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Routes that never require authentication. Mirrors the public set from
 * the former edge proxy so the client gate makes the same decisions.
 */
const PUBLIC_PATHS = new Set(["/login"]);

/** Path prefix that requires the admin role. */
const ADMIN_PREFIX = "/admin";

/**
 * Route prefixes the `masyarakat` role is allowed to reach. Ported from
 * the allowlist in the former `src/proxy.ts`; any other route redirects
 * the user back to the masyarakat landing page.
 */
const MASYARAKAT_ALLOWED = ["/dashboard", "/drug-search", "/safety-checker", "/pasien"];

/**
 * Normalise a pathname for prefix matching. `trailingSlash: true` in the
 * Next config means in-app paths arrive with a trailing slash (for example
 * `/admin/dashboard/`); stripping it lets the prefix checks below match
 * both the slashed and unslashed forms.
 *
 * @param pathname - Raw pathname from `usePathname`.
 * @returns Pathname without a trailing slash (except the bare root).
 */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/**
 * Decide where the current request should be redirected, or null to allow
 * it through. Pure function of the resolved auth state and pathname so the
 * rules stay easy to read and mirror the former edge proxy.
 *
 * @param pathname - Normalised current pathname.
 * @param user - Authenticated user, or null when logged out.
 * @returns Target path to redirect to, or null to render the route.
 */
function redirectTarget(pathname: string, user: { role: Role } | null): string | null {
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user) {
    return isPublic ? null : "/login";
  }

  // Authenticated users have no reason to sit on the login page.
  if (isPublic) return landingForRole(user.role);

  if (pathname.startsWith(ADMIN_PREFIX) && user.role !== "admin") {
    return landingForRole(user.role);
  }

  if (user.role === "masyarakat") {
    const allowed = MASYARAKAT_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!allowed) return "/drug-search";
  }

  return null;
}

/**
 * Inner component that runs after the theme provider is mounted.
 *
 * @param props.children - Page content rendered inside the shell.
 */
function ShellContent({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  const pathname = normalize(rawPathname);
  const isLogin = pathname === "/login";
  // The bare root is owned by `src/app/page.tsx`, which performs its own
  // role-aware redirect; let it through so the two do not fight.
  const isRoot = pathname === "/";

  // Hydrate the session once on mount. The store reads any persisted token
  // and revalidates it; until then `hydrated` is false and we hold the UI.
  useEffect(() => {
    if (!hydrated) {
      fetchMe();
    }
  }, [hydrated, fetchMe]);

  // Auth + role gate. Runs only after hydration so it never acts on a
  // half-known session, and skips the root path handled elsewhere.
  const target = hydrated && !isRoot ? redirectTarget(pathname, user) : null;

  useEffect(() => {
    if (target && target !== pathname) {
      router.replace(target);
    }
  }, [target, pathname, router]);

  // Avoid flashing protected content: render nothing until hydration is
  // done, and while a redirect away from the current route is pending.
  if (!hydrated) return null;
  if (target && target !== pathname) return null;

  return (
    <>
      <div className="ambient" />
      <AmbientWorld enabled />
      <div className="app-shell">
        {!isLogin && user && <NavBar user={user} />}
        {isLogin && (
          <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
            <ThemeToggle />
          </div>
        )}
        {children}
      </div>
    </>
  );
}

/**
 * Public shell entry point invoked from `src/app/layout.tsx`. Configures
 * the theme provider and delegates to `ShellContent`.
 *
 * @param props.children - Page content rendered inside the shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
      <ShellContent>{children}</ShellContent>
    </ThemeProvider>
  );
}
