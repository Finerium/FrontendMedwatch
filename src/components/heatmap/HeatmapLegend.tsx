"use client";

export function HeatmapLegend() {
  return (
    <div className="bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        Frekuensi Efek Samping
      </p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">0%</span>
        {/* Light mode gradient */}
        <div
          className="flex-1 h-4 rounded-full dark:hidden"
          style={{
            background:
              "linear-gradient(to right, rgba(59,130,246,0.05), rgba(59,130,246,0.2), rgba(59,130,246,0.4), rgba(59,130,246,0.6), rgba(59,130,246,0.8), rgba(147,51,234,0.8))",
          }}
        />
        {/* Dark mode gradient */}
        <div
          className="flex-1 h-4 rounded-full hidden dark:block"
          style={{
            background:
              "linear-gradient(to right, rgba(139,92,246,0.05), rgba(139,92,246,0.3), rgba(139,92,246,0.5), rgba(139,92,246,0.7), rgba(168,85,247,0.9), rgba(236,72,153,0.9))",
          }}
        />
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">100%</span>
      </div>
    </div>
  );
}
