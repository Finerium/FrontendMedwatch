"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { DrugNetwork } from "@/components/network/DrugNetwork";
import { NetworkControls } from "@/components/network/NetworkControls";
import { NodeDetail } from "@/components/network/NodeDetail";
import { NetworkLegend } from "@/components/network/NetworkLegend";
import { Skeleton } from "@/components/ui/skeleton";
import { interactionNetwork, type DrugNode } from "@/data/interactions";
import { cn } from "@/lib/utils";

export default function DrugNetworkPage() {
  const [selectedNode, setSelectedNode] = useState<DrugNode | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () =>
      new Set([
        "Analgesic",
        "Antibiotic",
        "Antihypertensive",
        "Antihistamine",
        "NSAID",
        "Gastrointestinal",
        "Antidiabetic",
        "Antidepressant",
        "Bronchodilator",
        "Corticosteroid",
      ])
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);


  const handleNodeClick = useCallback((node: DrugNode) => {
    setSelectedNode(node);
  }, []);

  const handleToggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        // Don't allow removing all categories
        if (next.size <= 1) return prev;
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    // Zoom via the ForceGraph ref is handled through the graph component
    // We use a DOM-level event to communicate
    const canvas = document.querySelector(
      ".drug-network-container canvas"
    ) as HTMLCanvasElement;
    if (canvas) {
      canvas.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -200, bubbles: true })
      );
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const canvas = document.querySelector(
      ".drug-network-container canvas"
    ) as HTMLCanvasElement;
    if (canvas) {
      canvas.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 200, bubbles: true })
      );
    }
  }, []);

  const handleZoomReset = useCallback(() => {
    const canvas = document.querySelector(
      ".drug-network-container canvas"
    ) as HTMLCanvasElement;
    if (canvas) {
      // Double-click to reset view
      canvas.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    }
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Drug Interaction Network
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi interaksi antar obat dalam bentuk graf jaringan
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Total Obat",
              value: interactionNetwork.nodes.length,
              color: "text-blue-500",
            },
            {
              label: "Total Interaksi",
              value: interactionNetwork.edges.length,
              color: "text-purple-500",
            },
            {
              label: "Interaksi Major",
              value: interactionNetwork.edges.filter(
                (e) => e.severity === "Major"
              ).length,
              color: "text-red-500",
            },
            {
              label: "Kategori Aktif",
              value: activeCategories.size,
              color: "text-teal-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "bg-white/70 dark:bg-white/[0.05]",
                "backdrop-blur-xl",
                "border border-black/[0.06] dark:border-white/[0.08]",
                "rounded-xl",
                "shadow-sm dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2)]",
                "px-4 py-2.5 flex items-center gap-3"
              )}
            >
              <span
                className={cn(
                  "text-xl font-bold font-mono",
                  stat.color
                )}
              >
                {stat.value}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main Graph Area */}
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "bg-white/70 dark:bg-white/[0.05]",
            "backdrop-blur-xl",
            "border border-black/[0.06] dark:border-white/[0.08]",
            "shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"
          )}
          style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
          role="region"
          aria-label="Drug interaction network graph - interactive"
        >
          {/* Dark inner container for graph contrast */}
          <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-950/30 drug-network-container">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <div className="space-y-4 w-full max-w-md">
                  <Skeleton className="h-4 w-48 mx-auto" />
                  <div className="flex justify-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                  <div className="flex justify-center gap-6">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32 mx-auto" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
                  Memuat jaringan interaksi...
                </p>
              </div>
            ) : (
              <DrugNetwork
                nodes={interactionNetwork.nodes}
                edges={interactionNetwork.edges}
                onNodeClick={handleNodeClick}
                activeCategories={activeCategories}
              />
            )}
          </div>

          {/* Overlay Controls - top left */}
          {!isLoading && (
            <div className="absolute top-4 left-4 z-10">
              <NetworkControls
                activeCategories={activeCategories}
                onToggleCategory={handleToggleCategory}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
              />
            </div>
          )}

          {/* Overlay Legend - bottom right (moves left if detail panel open) */}
          {!isLoading && (
            <div className={cn(
              "absolute bottom-4 z-10 transition-all duration-300",
              selectedNode ? "right-[356px]" : "right-4"
            )}>
              <NetworkLegend />
            </div>
          )}

          {/* Node Detail Panel - right side */}
          <AnimatePresence>
            {selectedNode && (
              <NodeDetail
                node={selectedNode}
                edges={interactionNetwork.edges}
                allNodes={interactionNetwork.nodes}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
