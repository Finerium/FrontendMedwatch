"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type ScrapeJob = {
  name: string;
  status: "running" | "success" | "failed";
  last: string;
  count: string;
};

const sevMap: Record<ScrapeJob["status"], "sedang" | "ringan" | "serius"> = {
  running: "sedang",
  success: "ringan",
  failed: "serius",
};

export default function AdminScraperPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([
    { name: "BPOM · daftar obat", status: "success", last: "3 menit lalu", count: "12.428" },
    { name: "WHO · adverse reactions", status: "success", last: "1 jam lalu", count: "8.901" },
    { name: "PIONAS · interaksi", status: "success", last: "6 jam lalu", count: "4.156" },
    { name: "BPJS · formularium", status: "failed", last: "2 hari lalu", count: "—" },
    { name: "Kemenkes · regulasi", status: "success", last: "1 hari lalu", count: "342" },
  ]);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runJob = async (i: number) => {
    setBusyIdx(i);
    setError(null);
    setJobs((prev) => prev.map((j, k) => (k === i ? { ...j, status: "running" } : j)));
    try {
      await api.post("/api/admin/scrape");
      setJobs((prev) =>
        prev.map((j, k) =>
          k === i ? { ...j, status: "success", last: "baru saja" } : j,
        ),
      );
    } catch (e) {
      setJobs((prev) => prev.map((j, k) => (k === i ? { ...j, status: "failed" } : j)));
      setError(e instanceof Error ? e.message : "Scrape gagal");
    } finally {
      setBusyIdx(null);
    }
  };

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", maxWidth: 1440, margin: "0 auto", position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          top: 100,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "var(--ink)",
          opacity: 0.92,
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
          Scraper · cron jobs
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
          Sumber <em style={{ fontStyle: "italic" }}>data</em>.
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {jobs.map((j, i) => (
            <div
              key={i}
              className="glass lift"
              style={{
                padding: 18,
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{j.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                  terakhir: {j.last}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>
                {j.count}
              </span>
              <span className={"sev sev-" + sevMap[j.status]}>
                <span className="sev-dot" />
                {j.status}
              </span>
              <button
                className="btn"
                style={{ padding: "8px 12px", fontSize: 12 }}
                onClick={() => runJob(i)}
                disabled={busyIdx === i}
              >
                {busyIdx === i ? "Run…" : "Run"}
              </button>
            </div>
          ))}
        </div>
        {error && (
          <div
            style={{
              marginTop: 16,
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
      </div>
    </div>
  );
}
