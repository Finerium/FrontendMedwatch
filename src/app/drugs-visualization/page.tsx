/**
 * Drug-catalog visualisation page. Marked `"use client"` because every
 * chart is drawn from a single live fetch to
 * `/api/visualizations/drugs-catalog` and rendered with Recharts in the
 * browser. When the endpoint returns an empty payload the page shows an
 * honest empty-state per section rather than fabricating numbers, mirroring
 * the approach used by the existing clinic statistics page.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "@/lib/api";

/** One labelled count returned by the catalog aggregations. */
type LabelValue = { label: string; value: number };

/** Headline counters shown in the stat band. */
type StatBand = {
  total_obat: number;
  total_ndc: number;
  total_rute: number;
  total_reaksi_faers: number;
  total_penarikan: number;
};

/** Full shape of GET /api/visualizations/drugs-catalog. */
type DrugsCatalog = {
  stat_band: StatBand;
  per_rute: LabelValue[];
  per_bentuk_sediaan: LabelValue[];
  penarikan_per_kelas: LabelValue[];
  efek_samping_terbanyak: LabelValue[];
  cakupan_sumber: LabelValue[];
  sumber: string;
};

/**
 * Palette reused across the donut and bars. Drawn from the existing brand
 * tokens so the page matches the rest of the app in both themes.
 */
const PALETTE = [
  "var(--teal)",
  "var(--ink)",
  "var(--warn)",
  "var(--crit)",
  "var(--teal-deep)",
  "var(--ink-3)",
];

/** Number of leading slices kept before the rest collapse into "Lainnya". */
const DONUT_TOP_SLICES = 5;

/** Format an integer with Indonesian thousands separators. */
function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

/** A single stat-band tile. */
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="glass"
      style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <span
        className="serif"
        style={{ fontSize: "2.4rem", fontWeight: 300, lineHeight: 1, color: "var(--ink)" }}
      >
        {formatCount(value)}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Glass card wrapper for one chart. Renders the chart when `hasData` is
 * true, a skeleton while `loaded` is false, and an honest empty-state
 * otherwise so the page never invents data.
 */
function ChartCard({
  title,
  caption,
  loaded,
  hasData,
  children,
}: {
  title: string;
  caption: string;
  loaded: boolean;
  hasData: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="glass" style={{ padding: 24, minHeight: 320, display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <h3 className="serif" style={{ fontSize: "1.4rem" }}>
          {title}
        </h3>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {caption}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {!loaded ? (
          <div className="skel" style={{ width: "100%", height: 240 }} aria-hidden />
        ) : hasData ? (
          children
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "0 12px" }}>
            Data belum tersedia dari sumber. Tidak ada angka yang ditampilkan agar visualisasi tetap jujur.
          </p>
        )}
      </div>
    </div>
  );
}

/** Tooltip styling shared by every Recharts chart on this page. */
const TOOLTIP_STYLE = {
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--ink)",
} as const;

/**
 * Render the drug-catalog dashboard: a stat band plus five charts driven by
 * openFDA aggregations. All visual data comes from a single authenticated
 * fetch; empty sections degrade to an honest message.
 */
export default function DrugsVisualizationPage() {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<DrugsCatalog | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<DrugsCatalog>("/api/visualizations/drugs-catalog");
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(
            e instanceof ApiError
              ? "Gagal memuat data katalog obat dari server."
              : "Tidak dapat terhubung ke server."
          );
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stat: StatBand = data?.stat_band ?? {
    total_obat: 0,
    total_ndc: 0,
    total_rute: 0,
    total_reaksi_faers: 0,
    total_penarikan: 0,
  };

  const perRute = useMemo<LabelValue[]>(
    () => (Array.isArray(data?.per_rute) ? data!.per_rute.filter((d) => d && d.label) : []),
    [data]
  );
  const perBentuk = useMemo<LabelValue[]>(
    () =>
      Array.isArray(data?.per_bentuk_sediaan)
        ? data!.per_bentuk_sediaan.filter((d) => d && d.label)
        : [],
    [data]
  );
  const cakupanSumber = useMemo<LabelValue[]>(
    () => (Array.isArray(data?.cakupan_sumber) ? data!.cakupan_sumber.filter((d) => d && d.label) : []),
    [data]
  );
  const efekSamping = useMemo<LabelValue[]>(
    () =>
      Array.isArray(data?.efek_samping_terbanyak)
        ? data!.efek_samping_terbanyak.filter((d) => d && d.label)
        : [],
    [data]
  );

  // Horizontal bar shows the top routes by count, highest first.
  const ruteBar = useMemo(
    () => [...perRute].sort((a, b) => b.value - a.value).slice(0, 8),
    [perRute]
  );

  // Donut keeps the top slices and folds the remainder into "Lainnya" so
  // the composition stays readable without dropping any total.
  const ruteDonut = useMemo<LabelValue[]>(() => {
    const sorted = [...perRute].sort((a, b) => b.value - a.value);
    if (sorted.length <= DONUT_TOP_SLICES) return sorted;
    const head = sorted.slice(0, DONUT_TOP_SLICES);
    const rest = sorted.slice(DONUT_TOP_SLICES).reduce((sum, d) => sum + (d.value || 0), 0);
    return rest > 0 ? [...head, { label: "Lainnya", value: rest }] : head;
  }, [perRute]);

  const bentukBar = useMemo(
    () => [...perBentuk].sort((a, b) => b.value - a.value).slice(0, 8),
    [perBentuk]
  );
  const cakupanBar = useMemo(
    () => [...cakupanSumber].sort((a, b) => b.value - a.value),
    [cakupanSumber]
  );
  const efekBar = useMemo(
    () => [...efekSamping].sort((a, b) => b.value - a.value).slice(0, 8),
    [efekSamping]
  );

  const sumber = data?.sumber?.trim() || "openFDA / U.S. National Library of Medicine";

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 90,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "var(--teal)",
          opacity: 0.85,
          zIndex: 0,
        }}
        aria-hidden
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
          Visualisasi Obat · katalog openFDA
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 18,
          }}
        >
          Cakupan <em style={{ fontStyle: "italic" }}>katalog</em>.
        </h1>

        <p style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: 720, marginBottom: 28 }}>
          Ringkasan katalog obat: jumlah total obat, kode NDC, rute pemberian,
          reaksi FAERS, dan penarikan. Setiap grafik dibangun dari agregasi
          data publik openFDA dan menampilkan cakupan lintas-bidang basis data.
        </p>

        {errorMessage && (
          <div
            role="status"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 24,
              background: "color-mix(in oklab, var(--crit) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--crit) 28%, transparent)",
              color: "var(--crit-deep)",
              fontSize: 13,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Stat band */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {!loaded ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: 96, borderRadius: 16 }} aria-hidden />
            ))
          ) : (
            <>
              <StatTile label="Total Obat" value={stat.total_obat} />
              <StatTile label="Total NDC" value={stat.total_ndc} />
              <StatTile label="Total Rute" value={stat.total_rute} />
              <StatTile label="Reaksi FAERS" value={stat.total_reaksi_faers} />
              <StatTile label="Total Penarikan" value={stat.total_penarikan} />
            </>
          )}
        </div>

        {/* Chart grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 16,
          }}
        >
          <ChartCard
            title="Rute pemberian teratas"
            caption="per rute · jumlah obat"
            loaded={loaded}
            hasData={ruteBar.length > 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={ruteBar}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-3)" }} stroke="var(--line)" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fontSize: 11, fill: "var(--ink-2)" }}
                  stroke="var(--line)"
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--bg-2)" }} />
                <Bar dataKey="value" name="Jumlah" fill="var(--teal)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Komposisi rute"
            caption="proporsi rute · top + lainnya"
            loaded={loaded}
            hasData={ruteDonut.length > 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={ruteDonut}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="var(--bg)"
                >
                  {ruteDonut.map((entry, i) => (
                    <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {ruteDonut.map((entry, i) => (
                <span
                  key={entry.label}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-2)" }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: PALETTE[i % PALETTE.length],
                    }}
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Bentuk sediaan"
            caption="per bentuk · jumlah obat"
            loaded={loaded}
            hasData={bentukBar.length > 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bentukBar} margin={{ top: 4, right: 12, left: 0, bottom: 24 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--ink-3)" }}
                  stroke="var(--line)"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={48}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} stroke="var(--line)" />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--bg-2)" }} />
                <Bar dataKey="value" name="Jumlah" fill="var(--ink)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Cakupan sumber data"
            caption="kelengkapan lintas-bidang"
            loaded={loaded}
            hasData={cakupanBar.length > 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={cakupanBar}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-3)" }} stroke="var(--line)" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  tick={{ fontSize: 11, fill: "var(--ink-2)" }}
                  stroke="var(--line)"
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--bg-2)" }} />
                <Bar dataKey="value" name="Jumlah" radius={[0, 6, 6, 0]}>
                  {cakupanBar.map((entry, i) => (
                    <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Efek samping terbanyak"
            caption="reaksi FAERS · top"
            loaded={loaded}
            hasData={efekBar.length > 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={efekBar}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-3)" }} stroke="var(--line)" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  tick={{ fontSize: 11, fill: "var(--ink-2)" }}
                  stroke="var(--line)"
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--bg-2)" }} />
                <Bar dataKey="value" name="Laporan" fill="var(--warn)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "var(--ink-3)",
            lineHeight: 1.6,
          }}
        >
          Sumber data: {sumber}. Data atas kebaikan U.S. National Library of
          Medicine / openFDA.
        </p>
      </div>
    </div>
  );
}
