/**
 * Masyarakat self-service profile. Marked `"use client"` because the
 * greeting reads the live auth store and renders user-specific copy.
 * The "obat saya" and "riwayat pengecekan" panels are still static seed
 * data; they will be wired to the backend later.
 */
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Static key/value display row used inside the identity card.
 *
 * @param props.k - Label text.
 * @param props.v - Value (string or rendered chip).
 */
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span style={{ color: "var(--ink-3)" }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

/**
 * Render the masyarakat profile card and the supporting "obat saya" /
 * "riwayat pengecekan" panels.
 */
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) fetchMe();
  }, [hydrated, fetchMe]);

  const username = user?.username || "umum_budi";
  const displayName = user?.name || "Budi Santoso";
  const initials = username.slice(0, 2).toUpperCase();
  const firstName = displayName.split(" ")[0];

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1100, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 80,
          right: -60,
          width: 220,
          height: 220,
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
          Profil saya
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          Halo, <em style={{ fontStyle: "italic" }}>{firstName}</em>.
        </h1>
        <div
          className="prof-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}
        >
          <div
            className="glass"
            style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "var(--teal-soft)",
                color: "var(--teal-deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontFamily: "Fraunces, serif",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{displayName}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                {username}
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, fontSize: 13 }}>
              <Row k="Lahir" v="14 Mar 1981" />
              <Row k="Faskes" v="Posyandu Cibiru" />
              <Row k="Bidan" v="Bidan Siti" />
              <Row k="Status" v={<span className="chip chip-teal">aktif</span>} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h3 className="serif" style={{ fontSize: "1.4rem", marginBottom: 14 }}>
                Obat saya
              </h3>
              {[
                { name: "Paracetamol 500mg", schedule: "3x sehari", remaining: "12 tablet" },
                { name: "Vitamin D3 1000 IU", schedule: "Pagi", remaining: "24 kapsul" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--line-2)",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{m.schedule}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {m.remaining}
                  </span>
                </div>
              ))}
            </div>
            <div className="glass" style={{ padding: 24 }}>
              <h3 className="serif" style={{ fontSize: "1.4rem", marginBottom: 14 }}>
                Riwayat pengecekan
              </h3>
              {[
                "Paracetamol × ibuprofen - aman",
                "Amoxicillin - aman",
                "Cetirizine × paracetamol - aman",
              ].map((r, i) => (
                <div key={i} style={{ padding: "8px 0", fontSize: 13, color: "var(--ink-2)" }}>
                  · {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 880px) { .prof-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
