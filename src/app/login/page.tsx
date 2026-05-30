/**
 * Entry experience for the static-export build. Marked `"use client"`
 * because it owns controlled form state, the parallax shapes that follow
 * the cursor, and the auth mutations that run entirely in the browser via
 * the auth store.
 *
 * The screen is a tiny in-page router with three views:
 *   - "cards": role selection. Desktop (Electron) shows Bidan and
 *     Masyarakat; web additionally shows Admin.
 *   - "auth": a login-or-register panel scoped to the chosen role, with a
 *     toggle between "Masuk" and "Daftar". The role is carried through:
 *     register auto-sets it, login just authenticates.
 *   - the Admin card (web only) runs a silent demo tour: it logs in the
 *     seeded admin account behind the scenes and routes to the admin
 *     dashboard. No credentials are ever rendered.
 *
 * Static-export note: `useSearchParams` is wrapped in a Suspense boundary
 * so the page can render at build time for the desktop export while keeping
 * the same client behaviour.
 */
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, landingForRole, type Role } from "@/lib/auth-store";
import { apiBase } from "@/lib/api-base";
import { evaluatePassword } from "@/lib/password-strength";

/** A self-service role the entry cards can scope login/register to. */
type SelfServiceRole = "tenaga_kesehatan" | "masyarakat";

/** Visual descriptor for one role card. */
type RoleCard = {
  role: SelfServiceRole;
  title: string;
  description: string;
  color: string;
};

/** The two self-service role cards shown in every runtime mode. */
const ROLE_CARDS: RoleCard[] = [
  {
    role: "tenaga_kesehatan",
    title: "Bidan",
    description: "Tenaga kesehatan: kelola pasien, rekam medis SOAP, dan cek keamanan obat.",
    color: "var(--teal)",
  },
  {
    role: "masyarakat",
    title: "Masyarakat",
    description: "Cari informasi obat dan periksa keamanan pemakaian secara mandiri.",
    color: "var(--warn)",
  },
];

/** Username of the seeded admin account used by the silent demo tour. */
const ADMIN_DEMO_USERNAME = "admin_ghaisan";
/**
 * Password for the seeded admin demo account. Used only for the silent
 * demo-login call below and never rendered anywhere in the UI.
 */
const ADMIN_DEMO_PASSWORD = "admin2026";

/**
 * Page-level wrapper. `useSearchParams` requires a Suspense boundary at the
 * App-Router build layer; the inner component owns all the state.
 *
 * @returns Suspense-wrapped entry screen.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <EntryInner />
    </Suspense>
  );
}

/**
 * Interactive entry screen. Resolves the runtime mode, drives the parallax,
 * and switches between the role cards and the scoped auth panel.
 */
function EntryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromPath = params.get("from") || "";

  // Web mode (empty base) exposes the Admin demo card; desktop hides it.
  const isWeb = apiBase() === "";

  const [view, setView] = useState<"cards" | "auth">("cards");
  const [selectedRole, setSelectedRole] = useState<SelfServiceRole>("tenaga_kesehatan");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

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

  const goToRole = (role: SelfServiceRole) => {
    setSelectedRole(role);
    setView("auth");
  };

  /** Resolve the post-auth destination, honouring the `from` query param. */
  const destinationFor = (role: Role): string => {
    return fromPath && fromPath !== "/login" ? fromPath : landingForRole(role);
  };

  /**
   * Silent admin demo tour (web only). Logs in the seeded admin account
   * behind the scenes and routes to the admin dashboard. The password is
   * never shown; it lives only in this call.
   */
  const startAdminTour = async () => {
    setAdminError("");
    setAdminLoading(true);
    const result = await login(ADMIN_DEMO_USERNAME, ADMIN_DEMO_PASSWORD);
    if (!result.ok) {
      setAdminLoading(false);
      setAdminError(result.error || "Demo admin tidak tersedia saat ini.");
      return;
    }
    router.replace(destinationFor("admin"));
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
        <IntroPanel />

        <div
          className="glass"
          style={{
            padding: 36,
            minWidth: 0,
            backdropFilter: "blur(40px) saturate(1.7)",
            WebkitBackdropFilter: "blur(40px) saturate(1.7)",
          }}
        >
          {view === "cards" ? (
            <RoleSelection
              isWeb={isWeb}
              onPickRole={goToRole}
              onAdminTour={startAdminTour}
              adminLoading={adminLoading}
              adminError={adminError}
            />
          ) : (
            <AuthPanel
              role={selectedRole}
              onBack={() => setView("cards")}
              destinationFor={destinationFor}
            />
          )}
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

/** Static marketing column shown beside the auth panel. */
function IntroPanel() {
  return (
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
          fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
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
        <span>MEDWATCH · KEAMANAN OBAT TERPADU</span>
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
        {["Skrining ribuan obat", "SOAP digital", "BPOM · WHO synced", "Severity engine"].map((t, i) => (
          <span key={i} className="chip">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Role-selection view: a card per role with no names or passwords. The
 * Admin card only renders in web mode and launches the silent demo tour.
 */
function RoleSelection({
  isWeb,
  onPickRole,
  onAdminTour,
  adminLoading,
  adminError,
}: {
  isWeb: boolean;
  onPickRole: (role: SelfServiceRole) => void;
  onAdminTour: () => void;
  adminLoading: boolean;
  adminError: string;
}) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="serif" style={{ fontSize: "1.9rem", fontWeight: 400 }}>
          Pilih peran
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
          Pilih peran untuk masuk atau mendaftar.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {ROLE_CARDS.map((card) => (
          <button
            key={card.role}
            type="button"
            onClick={() => onPickRole(card.role)}
            className="lift"
            style={{
              padding: "18px 18px",
              border: "1px solid var(--line)",
              background: "transparent",
              borderRadius: 14,
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 14,
              alignItems: "center",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 280ms",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: card.color,
                opacity: 0.9,
                flexShrink: 0,
              }}
            />
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{card.title}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>
                {card.description}
              </span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        ))}

        {isWeb && (
          <button
            type="button"
            onClick={onAdminTour}
            disabled={adminLoading}
            className="lift"
            style={{
              padding: "18px 18px",
              border: "1px solid var(--line)",
              background: "transparent",
              borderRadius: 14,
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 14,
              alignItems: "center",
              cursor: adminLoading ? "default" : "pointer",
              textAlign: "left",
              transition: "all 280ms",
              opacity: adminLoading ? 0.7 : 1,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: "var(--crit)",
                opacity: 0.9,
                flexShrink: 0,
              }}
            />
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Admin</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>
                Tur demo administrator: masuk otomatis ke dasbor admin.
              </span>
            </span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.08em" }}>
              {adminLoading ? "..." : "DEMO"}
            </span>
          </button>
        )}
      </div>

      {adminError && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 10,
            background: "color-mix(in oklab, var(--crit) 12%, transparent)",
            color: "var(--crit-deep)",
            fontSize: 13,
            border: "1px solid color-mix(in oklab, var(--crit) 30%, transparent)",
          }}
        >
          {adminError}
        </div>
      )}
    </div>
  );
}

/** Human-readable label for each self-service role. */
const ROLE_LABEL: Record<SelfServiceRole, string> = {
  tenaga_kesehatan: "Bidan",
  masyarakat: "Masyarakat",
};

/**
 * Login-or-register panel scoped to a single role. The role is fixed by the
 * card the user came from; register auto-sets it and login just
 * authenticates against the chosen account.
 */
function AuthPanel({
  role,
  onBack,
  destinationFor,
}: {
  role: SelfServiceRole;
  onBack: () => void;
  destinationFor: (role: Role) => string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke pilihan peran"
          style={{
            border: "1px solid var(--line)",
            background: "transparent",
            borderRadius: 10,
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ink-2)",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <div style={{ minWidth: 0 }}>
          <h2 className="serif" style={{ fontSize: "1.6rem", fontWeight: 400, lineHeight: 1.1 }}>
            {mode === "login" ? "Masuk" : "Daftar"}
          </h2>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            Peran: {ROLE_LABEL[role]}
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Mode autentikasi"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          padding: 4,
          background: "var(--bg-2)",
          borderRadius: 12,
          marginBottom: 22,
        }}
      >
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            style={{
              padding: "10px 12px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: mode === m ? "var(--ink)" : "var(--ink-3)",
              background: mode === m ? "var(--bg)" : "transparent",
              boxShadow: mode === m ? "0 1px 4px -2px rgba(26,24,21,0.3)" : "none",
              transition: "all 220ms",
            }}
          >
            {m === "login" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <LoginForm destinationFor={destinationFor} />
      ) : (
        <RegisterForm role={role} destinationFor={destinationFor} />
      )}
    </div>
  );
}

/** Shared field-label style used by both forms. */
const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.1em",
  color: "var(--ink-3)",
  textTransform: "uppercase",
};

/** Shared error-box style used by both forms. */
const errorBoxStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  background: "color-mix(in oklab, var(--crit) 12%, transparent)",
  color: "var(--crit-deep)",
  fontSize: 13,
  border: "1px solid color-mix(in oklab, var(--crit) 30%, transparent)",
};

/**
 * Plain login form. Authenticates the typed credentials and routes to the
 * role landing page (or the original `from` target) on success.
 */
function LoginForm({ destinationFor }: { destinationFor: (role: Role) => string }) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setLoading(true);
    const result = await login(u, p);
    if (!result.ok) {
      setLoading(false);
      setError(result.error || "Username atau password salah.");
      return;
    }
    const role = useAuthStore.getState().user?.role;
    router.replace(role ? destinationFor(role as Role) : "/dashboard");
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mono" style={fieldLabelStyle}>
          Username
        </span>
        <input
          className="input"
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mono" style={fieldLabelStyle}>
          Password
        </span>
        <input
          className="input"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <SubmitButton loading={loading} label="Masuk" loadingLabel="Menghubungkan..." />
    </form>
  );
}

/**
 * Register form scoped to a fixed role. Shows a real-time strength meter
 * that mirrors the server policy and disables submit until every hard
 * requirement is met. On 201 the token is persisted by the store and the
 * user is routed to the role landing page; 400/409/429 errors surface in
 * Indonesian.
 */
function RegisterForm({
  role,
  destinationFor,
}: {
  role: SelfServiceRole;
  destinationFor: (role: Role) => string;
}) {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const evaluation = useMemo(() => evaluatePassword(password, username), [password, username]);

  const usernameOk = username.trim().length >= 3;
  const nameOk = name.trim().length >= 1;
  const canSubmit = usernameOk && nameOk && evaluation.valid && !loading;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setLoading(true);
    const result = await register({
      username: username.trim(),
      name: name.trim(),
      password,
      role,
      phone: phone.trim() ? phone.trim() : undefined,
    });
    if (!result.ok) {
      setLoading(false);
      setError(result.error || "Pendaftaran gagal. Periksa kembali data Anda.");
      return;
    }
    const newRole = useAuthStore.getState().user?.role;
    router.replace(newRole ? destinationFor(newRole as Role) : landingForRole(role));
  };

  const meterColors = ["var(--crit)", "var(--crit)", "var(--warn)", "var(--teal)", "var(--teal)"];
  const meterLabels = ["Sangat lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"];
  const meterColor = meterColors[evaluation.score] ?? "var(--ink-4)";
  const meterLabel = password.length > 0 ? meterLabels[evaluation.score] ?? "" : "";

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mono" style={fieldLabelStyle}>
          Username
        </span>
        <input
          className="input"
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mono" style={fieldLabelStyle}>
          Nama lengkap
        </span>
        <input
          className="input"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mono" style={fieldLabelStyle}>
          Password
        </span>
        <input
          className="input"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>

      {/* Strength meter mirroring the server policy. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: -4 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              aria-hidden
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                background: i < evaluation.score ? meterColor : "var(--bg-2)",
                transition: "background 240ms",
              }}
            />
          ))}
        </div>
        {meterLabel && (
          <span className="mono" style={{ fontSize: 11, color: meterColor }}>
            Kekuatan: {meterLabel}
          </span>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {evaluation.requirements.map((req) => (
            <li
              key={req.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 11,
                color: req.met ? "var(--ink-2)" : "var(--ink-3)",
              }}
            >
              <span
                aria-hidden
                style={{
                  marginTop: 1,
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: req.met ? "var(--bg)" : "var(--ink-3)",
                  background: req.met ? "var(--teal)" : "transparent",
                  border: req.met ? "none" : "1px solid var(--line)",
                }}
              >
                {req.met ? "v" : ""}
              </span>
              {req.label}
            </li>
          ))}
        </ul>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mono" style={fieldLabelStyle}>
          Nomor telepon (opsional)
        </span>
        <input
          className="input"
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
        />
      </label>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn btn-primary"
        style={{
          padding: "16px 22px",
          justifyContent: "center",
          marginTop: 4,
          fontSize: 15,
          opacity: canSubmit ? 1 : 0.55,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Mendaftarkan..." : "Daftar"}
      </button>
    </form>
  );
}

/** Primary submit button with an inline spinner while a request is pending. */
function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
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
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </>
      )}
    </button>
  );
}
