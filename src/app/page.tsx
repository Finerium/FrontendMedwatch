/**
 * Application root. Pure server component (no `"use client"`); the edge
 * proxy already redirects authenticated users to their role landing, so
 * this fallback is reached only briefly while the cookie is verified.
 */
import { redirect } from "next/navigation";

/**
 * Force-redirect the unauthenticated visitor to the bidan dashboard;
 * the proxy will subsequently route the call through /login when no
 * session cookie is present.
 */
export default function Home() {
  redirect("/dashboard");
}
