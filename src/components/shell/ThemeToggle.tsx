"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? (resolvedTheme || theme || "light") : "light";
  const isDark = current === "dark";

  return (
    <button
      className="btn btn-ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid var(--line)" }}
      aria-label="Toggle theme"
    >
      <span
        style={{
          position: "relative",
          width: 36,
          height: 18,
          borderRadius: 999,
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 1,
            left: isDark ? 18 : 1,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: isDark ? "var(--teal)" : "var(--ink)",
            transition: "left 380ms cubic-bezier(0.22, 1, 0.36, 1), background 300ms",
          }}
        />
      </span>
      <span className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.06em" }}>
        {isDark ? "DARK" : "LIGHT"}
      </span>
    </button>
  );
}
