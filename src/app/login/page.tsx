"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, landingForRole, type Role } from "@/lib/auth-store";

export const dynamic = "force-dynamic";

type Preset = {
  label: string;
  u: string;
  p: string;
  role: Role;
  color: string;
};

const PRESETS: Preset[] = [
  { label: "Bidan", u: "bidan_siti", p: "siti2026", role: "tenaga_kesehatan", color: "var(--teal)" },
  { label: "Masyarakat", u: "umum_budi", p: "budi2026", role: "masyarakat", color: "var(--warn)" },
  { label: "Admin", u: "admin_ghaisan", p: "admin2026", role: "admin", color: "var(--crit)" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromPath = params.get("from") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [shapeXY, setShapeXY] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      setShapeXY({ x: x * 30, y: y * 30 });
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    if (!result.ok) {
      setLoading(false);
      setError(result.error || "Kredensial tidak cocok dengan akun demo.");
      return;
    }
    const role = useAuthStore.getState().user?.role;
    const dest = fromPath && fromPath !== "/login" ? fromPath : (role ? landingForRole(role as Role) : "/dashboard");
    router.replace(dest);
  };

  const fillPreset = (p: Preset) => {
    setUsername(p.u);
    setPassword(p.p);
    setActivePreset(p.label);
    setError("");
  };

  return (
    <div
      ref={containerRef}
      className="page-in"
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr",
        alignItems: "center",
        justifyItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "clamp(420px, 55vw, 820px)",
          height: "clamp(420px, 55vw, 820px)",
          background: "var(--teal)",
          borderRadius: "50%",
          zIndex: 1,
          transform: `translate(${shapeXY.x}px, ${shapeXY.y}px)`,
          transition: "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          opacity: 0.92,
          filter: "blur(0.5px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-8%",
          left: "-6%",
          width: "clamp(220px, 28vw, 360px)",
          height: "clamp(220px, 28vw, 360px)",
          background: "var(--ink)",
          borderRadius: "50%",
          zIndex: 1,
          transform: `translate(${-shapeXY.x * 0.6}px, ${-shapeXY.y * 0.6}px)`,
          transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          opacity: 0.92,
        }}
      />

      <div
        className="login-grid"
        style={{
          position: "relative",
          zIndex: 5,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          maxWidth: 1280,
          width: "100%",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div className="stagger" style={{ minWidth: 0 }}>
          <div
            className="glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 999,
              marginBottom: 32,
              backdropFilter: "blur(28px) saturate(1.6)",
              WebkitBackdropFilter: "blur(28px) saturate(1.6)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--ink-2)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--teal)",
                boxShadow: "0 0 0 3px color-mix(in oklab, var(--teal) 25%, transparent)",
              }}
            />
            <span>POLITEKNIK NEGERI BANDUNG · TUGAS PROYEK KELOMPOK B5</span>
          </div>
          <h1
            className="serif"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 6rem)",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              marginBottom: 28,
              color: "var(--ink)",
            }}
          >
            Keamanan obat,
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>terjaga</em> di setiap resep.
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
              color: "var(--ink-2)",
              maxWidth: 480,
              marginBottom: 36,
              lineHeight: 1.6,
            }}
          >
            MedWatch membantu fasilitas kesehatan tingkat 1 memantau efek samping obat,
            mengelola rekam medis SOAP, dan memberikan rujukan keamanan obat real-time
            dari basis data BPOM dan WHO.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {["Skrining 12.4k obat", "SOAP digital", "BPOM · WHO synced", "Severity engine"].map((t, i) => (
              <span key={i} className="chip">
                {t}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, color: "var(--ink-3)" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
              <path d="M12 18 L17 23 L25 13" stroke="var(--teal)" strokeWidth="1.5" fill="none" />
            </svg>
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
                Kredensial demo tersedia
              </div>
              <div className="mono" style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                klik salah satu peran di kanan untuk auto-isi
              </div>
            </div>
          </div>
        </div>

        <div
          className="glass"
          style={{
            padding: 36,
            minWidth: 0,
            backdropFilter: "blur(40px) saturate(1.7)",
            WebkitBackdropFilter: "blur(40px) saturate(1.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <h2 className="serif" style={{ fontSize: "1.9rem", fontWeight: 400 }}>
              Masuk
            </h2>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              v2.6 · DEMO
            </span>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                }}
              >
                Username
              </span>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="bidan_siti"
                autoComplete="username"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                }}
              >
                Password
              </span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "color-mix(in oklab, var(--crit) 12%, transparent)",
                  color: "var(--crit-deep)",
                  fontSize: 13,
                  border: "1px solid color-mix(in oklab, var(--crit) 30%, transparent)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "16px 22px",
                justifyContent: "center",
                marginTop: 8,
                fontSize: 15,
                position: "relative",
              }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" fill="none">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="0.8s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                  Menghubungkan…
                </>
              ) : (
                <>
                  Masuk
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div style={{ margin: "28px 0 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em" }}
            >
              AKUN DEMO
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => fillPreset(p)}
                className="lift"
                style={{
                  padding: "14px 12px",
                  border: "1px solid " + (activePreset === p.label ? "var(--ink)" : "var(--line)"),
                  background: activePreset === p.label ? "var(--bg-2)" : "transparent",
                  borderRadius: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 280ms",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    background: p.color,
                    opacity: 0.85,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                  {p.label}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.04em" }}
                >
                  {p.u}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .login-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  );
}
