/**
 * Catch-all proxy from Vercel to the Cloud Run backend.
 *
 * Browser only ever sees the Vercel domain; the Cloud Run hostname stays
 * in the server-only `BACKEND_API_URL` env var so the upstream cannot be
 * reached directly. The JWT lives in an httpOnly cookie that this proxy
 * sets on a successful POST /api/auth/login and clears on POST
 * /api/auth/logout.
 *
 * HTTP verbs handled: GET, POST, PUT, DELETE (all multiplexed through
 * the same `handle` function below).
 *
 * Side effects:
 *   - Sets the `medwatch_token` httpOnly cookie on login.
 *   - Clears the same cookie on logout.
 *   - Otherwise stateless: each call forwards to the upstream and streams
 *     the binary response back unmodified.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Cloud Run base URL; server-only env var, never exposed to the browser. */
const BACKEND = process.env.BACKEND_API_URL!;

/** Cookie that carries the backend-issued JWT. */
const COOKIE_NAME = "medwatch_token";
/** Cookie TTL (12 hours), matching the backend JWT lifetime. */
const COOKIE_MAX_AGE = 12 * 60 * 60;

/**
 * Forward the request to the configured backend, attach the JWT bearer
 * header, and stream the response back to the caller. Captures the login
 * payload so the JWT can be promoted to an httpOnly cookie and clears
 * the cookie on logout.
 *
 * @param req - The Next.js request being proxied.
 * @param ctx - Route context containing the dynamic slug segments.
 * @returns The NextResponse to send back to the browser.
 */
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  if (!BACKEND) {
    return NextResponse.json(
      { error: "BACKEND_API_URL not configured" },
      { status: 502 }
    );
  }

  const { slug } = await ctx.params;
  const path = slug.join("/");
  const url = `${BACKEND}/api/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (lower === "host" || lower === "cookie" || lower === "connection") continue;
    headers.set(k, v);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
  };

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (e) {
    return NextResponse.json(
      { error: "upstream unreachable", detail: String(e) },
      { status: 502 }
    );
  }

  const respBody = await upstream.arrayBuffer();
  const respHeaders = new Headers();
  for (const [k, v] of upstream.headers.entries()) {
    const lower = k.toLowerCase();
    if (["transfer-encoding", "content-encoding", "content-length", "connection"].includes(lower)) continue;
    respHeaders.set(k, v);
  }

  const isLogin = path === "auth/login" && upstream.ok;
  const isLogout = path === "auth/logout";

  const nextResp = new NextResponse(respBody, {
    status: upstream.status,
    headers: respHeaders,
  });

  if (isLogin) {
    try {
      const dec = new TextDecoder();
      const text = dec.decode(respBody);
      const data = JSON.parse(text);
      if (data?.token) {
        nextResp.cookies.set(COOKIE_NAME, data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
          path: "/",
        });
      }
    } catch {
      // ignore parse errors; body still streamed back
    }
  }

  if (isLogout) {
    nextResp.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }

  return nextResp;
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
