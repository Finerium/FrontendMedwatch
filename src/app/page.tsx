/**
 * Application root. In the Vercel deployment the edge proxy redirects
 * authenticated users to their role landing before this component ever
 * renders. In the desktop static export there is no edge proxy, so the
 * root must perform the redirect on the client: read the session via
 * the auth store, then either route to `/login` or to the role landing.
 *
 * Marked `"use client"` because `useRouter` and `useEffect` are not
 * available in server components.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, landingForRole, type Role } from "@/lib/auth-store";

/**
 * Client-side router for the root path. Hydrates the auth store with a
 * single `/api/auth/me` call, then replaces the current entry in the
 * history stack with either `/login` or the role landing. While the
 * hydration is in flight, render nothing so the user does not see a
 * brief flash of the bidan dashboard before being bounced to login.
 *
 * @returns Empty placeholder; the navigation happens in `useEffect`.
 */
export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (!hydrated) {
      fetchMe();
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(landingForRole(user.role as Role));
  }, [hydrated, user, fetchMe, router]);

  return null;
}
