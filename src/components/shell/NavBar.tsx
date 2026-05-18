/**
 * Top/bottom navigation bar that adapts to viewport width. Marked
 * `"use client"` because it reads the live pathname, the auth store,
 * and listens to window resize to swap between desktop and mobile
 * variants.
 */
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore, type User } from "@/lib/auth-store";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { NavIcon } from "./NavIcon";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Whether a nav item should render as active given the current pathname.
 *
 * @param pathname - Pathname from `usePathname`.
 * @param item - One nav entry from the manifest.
 * @returns True if the item matches the current path or a child route.
 */
function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/dashboard" && pathname === "/dashboard") return true;
  if (item.href === "/admin/dashboard" && pathname === "/admin/dashboard") return true;
  if (item.href === pathname) return true;
  if (item.href !== "/" && pathname.startsWith(item.href + "/")) return true;
  return false;
}

/**
 * Desktop top-bar nav. Includes pill links, theme toggle, and the user
 * avatar/logout button.
 *
 * @param props.items - Role-appropriate nav entries.
 * @param props.user - Current authenticated user.
 */
function TopNav({ items, user }: { items: NavItem[]; user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header
      className="top-nav"
      style={{ position: "fixed", top: 16, left: 16, right: 16, zIndex: 50 }}
    >
      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 14px 10px 18px",
        }}
      >
        <Logo />
        <span style={{ flex: 1 }} />
        <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {items.map((it) => {
            const active = isActive(pathname, it);
            return (
              <Link
                key={it.id}
                href={it.href}
                className={"nav-pill" + (active ? " active" : "")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  border: "none",
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink-2)",
                  borderRadius: 999,
                  font: '500 13px/1 "Inter Tight", sans-serif',
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  transition: "all 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                <NavIcon name={it.icon} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <span style={{ width: 1, height: 24, background: "var(--line)" }} />
        <ThemeToggle />
        <button
          className="btn btn-ghost"
          onClick={handleLogout}
          style={{ padding: "6px 10px 6px 6px", gap: 8 }}
          title={user.username}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--teal-soft)",
              color: "var(--teal-deep)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </span>
          <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
            {user.role.split("_")[0]}
          </span>
        </button>
      </div>
    </header>
  );
}

/**
 * Mobile bottom-bar nav. Renders the same role items as the desktop
 * variant but stacks icons over labels.
 *
 * @param props.items - Role-appropriate nav entries.
 */
function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      className="bottom-nav"
      style={{ position: "fixed", bottom: 12, left: 12, right: 12, zIndex: 50 }}
    >
      <div
        className="glass"
        style={{ display: "flex", justifyContent: "space-around", padding: "8px 6px" }}
      >
        {items.map((it) => {
          const active = isActive(pathname, it);
          return (
            <Link
              key={it.id}
              href={it.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "8px 4px",
                background: "transparent",
                border: "none",
                color: active ? "var(--ink)" : "var(--ink-3)",
                cursor: "pointer",
                position: "relative",
                textDecoration: "none",
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 24,
                    height: 3,
                    borderRadius: 999,
                    background: "var(--teal)",
                  }}
                />
              )}
              <NavIcon name={it.icon} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Public nav-bar entry point. Picks the right items for the role and
 * swaps between top and bottom variants based on viewport width.
 *
 * @param props.user - The hydrated user object from the auth store.
 */
export function NavBar({ user }: { user: User }) {
  const items = NAV_ITEMS[user.role] ?? NAV_ITEMS.tenaga_kesehatan;
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile ? <BottomNav items={items} /> : <TopNav items={items} user={user} />;
}
