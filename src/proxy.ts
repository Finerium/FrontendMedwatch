/**
 * Edge-runtime authentication and role gate for every UI route. Renamed
 * from `middleware.ts` to `proxy.ts` to match the Next.js 16 convention
 * (the matcher and export contract are unchanged).
 *
 * Responsibilities:
 *   - Let public assets and login pass through.
 *   - Verify the JWT cookie and decode the embedded role.
 *   - Redirect each role to its landing page on the root.
 *   - Block non-admins from /admin/* and confine `masyarakat` to the
 *     allowlist below.
 *
 * Key exports: `proxy` (the runtime handler) and `config` (the matcher).
 */
import { NextRequest, NextResponse } from "next/server";

/** Pages that never require authentication. */
const PUBLIC_PATHS = new Set([
  "/login",
]);

/** Path prefixes that never require authentication. */
const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon",
  "/api/auth/login",
  "/api/auth/logout",
];

/** Path prefixes that require the admin role. */
const ADMIN_PREFIXES = ["/admin"];

/**
 * Return true when the requested path should bypass the auth gate.
 *
 * @param pathname - Pathname from the incoming request URL.
 * @returns True if the route is publicly reachable.
 */
function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Decode the `role` claim from a JWT cookie without verifying the
 * signature (the backend already verifies on every API call; the proxy
 * uses the claim only to drive UI redirects).
 *
 * @param token - Raw JWT string from the medwatch_token cookie.
 * @returns Role string or null when the token is malformed or expired.
 */
function decodeRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const payload = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Edge-runtime mirror of `landingForRole` in `src/lib/auth-store.ts`.
 * Kept inline so the middleware bundle does not import any client code.
 *
 * @param role - Role claim from the JWT.
 * @returns Absolute landing path for the role.
 */
function landingFor(role: string): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "masyarakat") return "/drug-search";
  return "/dashboard";
}

/**
 * Edge handler executed on every UI route. Returns either a pass-through
 * `NextResponse.next()` or a redirect that enforces the auth and role
 * rules described in the file header.
 *
 * @param req - The incoming `NextRequest`.
 * @returns NextResponse continuing or redirecting the request.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("medwatch_token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const role = decodeRole(token);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(landingFor(role), req.url));
  }

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && role !== "admin") {
    return NextResponse.redirect(new URL(landingFor(role), req.url));
  }

  if (role === "masyarakat") {
    const allowed = [
      "/dashboard",
      "/drug-search",
      "/safety-checker",
      "/pasien",
      "/api",
    ];
    if (!allowed.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/drug-search", req.url));
    }
  }

  return NextResponse.next();
}

/**
 * Next.js matcher config. Skips the API proxy, _next internals, static
 * favicon, and binary assets so the edge runtime only sees UI routes.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
