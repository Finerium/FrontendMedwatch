/**
 * Catch-all proxy from Vercel to Cloud Run backend.
 *
 * Browser only ever sees Vercel domain. Backend Cloud Run URL stays in
 * BACKEND_API_URL server-only env var. JWT lives in httpOnly cookie set
 * by this proxy on /api/auth/login.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_API_URL!;

const COOKIE_NAME = "medwatch_token";
const COOKIE_MAX_AGE = 12 * 60 * 60;

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
