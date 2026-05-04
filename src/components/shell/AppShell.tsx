"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { AmbientWorld } from "@/components/ambient/AmbientWorld";
import { NavBar } from "./NavBar";
import { ThemeToggle } from "./ThemeToggle";

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!hydrated && !isLogin) {
      fetchMe();
    }
  }, [hydrated, isLogin, fetchMe]);

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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
      <ShellContent>{children}</ShellContent>
    </ThemeProvider>
  );
}
