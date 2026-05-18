import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/login",
]);

const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon",
  "/api/auth/login",
  "/api/auth/logout",
];

const ADMIN_PREFIXES = ["/admin"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

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

function landingFor(role: string): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "masyarakat") return "/drug-search";
  return "/dashboard";
}

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

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
