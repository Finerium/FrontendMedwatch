"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type AdminUser = {
  username: string;
  role: "tenaga_kesehatan" | "masyarakat" | "admin";
  name?: string;
  phone?: string;
  faskes?: string;
  status?: "active" | "pending";
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<AdminUser[]>("/api/admin/users");
        if (!cancelled) setUsers(data || []);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Gagal memuat pengguna");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", maxWidth: 1440, margin: "0 auto", position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          top: 90,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "var(--teal)",
          opacity: 0.85,
          zIndex: 0,
        }}
      />
      <div className="stagger" style={{ position: "relative", zIndex: 2 }}>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          Manajemen pengguna
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.6rem, 5vw, 4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          Pengguna <em style={{ fontStyle: "italic" }}>terdaftar</em>.
        </h1>
        <div className="glass" style={{ padding: 8, minHeight: 380 }}>
          {loadError && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--crit-deep)" }}>{loadError}</div>
          )}
          {!loaded && !loadError && (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skel"
                style={{ height: 64, borderRadius: 12, margin: 4 }}
                aria-hidden
              />
            ))
          )}
          {loaded && !loadError && users.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--ink-3)" }}>
              Belum ada pengguna terdaftar.
            </div>
          )}
          {loaded && users.map((u) => {
            const status = u.status || "active";
            return (
              <div
                key={u.username}
                className="lift"
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1.2fr 1fr 1.4fr auto",
                  gap: 14,
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 12,
                  margin: 4,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--teal-soft)",
                    color: "var(--teal-deep)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontFamily: "JetBrains Mono",
                    fontWeight: 600,
                  }}
                >
                  {u.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                  {u.username}
                </span>
                <span className="chip">{u.role.replace("_", " ")}</span>
                <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
                  {u.faskes || u.name || "—"}
                </span>
                <span className={"sev " + (status === "active" ? "sev-ringan" : "sev-sedang")}>
                  <span className="sev-dot" />
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
