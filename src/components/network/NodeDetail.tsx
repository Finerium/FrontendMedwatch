/**
 * Slide-in detail panel for the drug network graph. Marked `"use client"`
 * because it animates with Framer Motion and rebuilds the connected-edge
 * list every time the selected node changes.
 */
"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrugNode, DrugEdge } from "@/data/interactions";
import type { DrugCategory } from "@/data/drugs";

const categoryColorMap: Record<DrugCategory, string> = {
  Analgesic: "#3b82f6",
  Antibiotic: "#22c55e",
  Antihypertensive: "#8b5cf6",
  Antihistamine: "#f59e0b",
  NSAID: "#ef4444",
  Gastrointestinal: "#06b6d4",
  Antidiabetic: "#ec4899",
  Antidepressant: "#f97316",
  Bronchodilator: "#14b8a6",
  Corticosteroid: "#a855f7",
};

/**
 * Render a colored severity pill for an interaction.
 *
 * @param severity - "Minor" | "Moderate" | "Major".
 */
function severityBadge(severity: "Minor" | "Moderate" | "Major") {
  const styles = {
    Minor: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
    Moderate: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    Major: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        styles[severity]
      )}
    >
      {severity}
    </span>
  );
}

interface NodeDetailProps {
  /** Currently selected node, or null to hide the panel. */
  node: DrugNode | null;
  /** All edges in the graph (filtered internally to connected ones). */
  edges: DrugEdge[];
  /** Full node set so neighbours can be looked up by id. */
  allNodes: DrugNode[];
  /** Close button callback. */
  onClose: () => void;
}

/**
 * Render the slide-in panel that lists every interaction involving the
 * selected drug.
 *
 * @param props - See `NodeDetailProps`.
 */
export function NodeDetail({ node, edges, allNodes, onClose }: NodeDetailProps) {
  if (!node) return null;

  // Find all edges connected to this node
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  // Sort: Major first, then Moderate, then Minor
  const sortedEdges = [...connectedEdges].sort((a, b) => {
    const order = { Major: 0, Moderate: 1, Minor: 2 };
    return order[a.severity] - order[b.severity];
  });

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "absolute top-0 right-0 h-full w-[340px] z-20",
        "bg-white/80 dark:bg-white/[0.08]",
        "backdrop-blur-2xl",
        "border-l border-black/[0.08] dark:border-white/[0.12]",
        "shadow-2xl dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)]",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2 pr-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {node.name}
            </h2>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{
                backgroundColor: `${categoryColorMap[node.category]}15`,
                borderColor: `${categoryColorMap[node.category]}30`,
                color: categoryColorMap[node.category],
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryColorMap[node.category] }}
              />
              {node.category}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drug detail panel"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
              {connectedEdges.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Interaksi
            </div>
          </div>
          <div className="h-8 w-px bg-black/[0.06] dark:bg-white/[0.08]" />
          <div className="flex gap-3">
            {(["Major", "Moderate", "Minor"] as const).map((sev) => {
              const count = connectedEdges.filter(
                (e) => e.severity === sev
              ).length;
              if (count === 0) return null;
              return (
                <div key={sev} className="text-center">
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-50">
                    {count}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {sev}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connected Drugs List */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Interaksi Obat
        </h3>
        <div className="space-y-3">
          {sortedEdges.map((edge, idx) => {
            const connectedId =
              edge.source === node.id ? edge.target : edge.source;
            const connectedDrug = nodeMap.get(connectedId);
            if (!connectedDrug) return null;

            return (
              <div
                key={`${edge.source}-${edge.target}-${idx}`}
                className={cn(
                  "p-3 rounded-xl",
                  "bg-white/50 dark:bg-white/[0.04]",
                  "border border-black/[0.04] dark:border-white/[0.06]",
                  "transition-colors hover:bg-white/70 dark:hover:bg-white/[0.06]"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          categoryColorMap[connectedDrug.category],
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {connectedDrug.name}
                    </span>
                  </div>
                  {severityBadge(edge.severity)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {edge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
