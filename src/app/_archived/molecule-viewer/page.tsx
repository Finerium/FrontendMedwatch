"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { MoleculeSelector } from "@/components/molecule/MoleculeSelector";
import { MoleculeInfo } from "@/components/molecule/MoleculeInfo";
import { ViewerControls } from "@/components/molecule/ViewerControls";
import { molecules } from "@/data/molecules";
import { Skeleton } from "@/components/ui/skeleton";

const MoleculeCanvas = dynamic(
  () => import("@/components/molecule/MoleculeCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center" style={{ height: '600px' }}>
        <div className="space-y-4 text-center">
          <Skeleton className="w-48 h-48 rounded-full mx-auto" />
          <Skeleton className="w-32 h-4 mx-auto" />
          <p className="text-xs text-slate-400">Memuat 3D viewer...</p>
        </div>
      </div>
    ),
  }
);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function MoleculeViewerPage() {
  const [selectedId, setSelectedId] = useState(molecules[0].id);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [key, setKey] = useState(0);

  const selectedMolecule = molecules.find((m) => m.id === selectedId) || molecules[0];

  const handleResetView = useCallback(() => {
    setKey((prev) => prev + 1);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            3D Molecule Viewer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi struktur molekul obat dalam 3 dimensi
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Left Sidebar */}
          <motion.div variants={itemVariants} className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
            <GlassCard>
              <MoleculeSelector
                molecules={molecules}
                selected={selectedId}
                onSelect={setSelectedId}
              />
            </GlassCard>
            <GlassCard>
              <MoleculeInfo molecule={selectedMolecule} />
            </GlassCard>
            <GlassCard>
              <ViewerControls
                autoRotate={autoRotate}
                wireframe={wireframe}
                onToggleRotate={() => setAutoRotate((prev) => !prev)}
                onToggleWireframe={() => setWireframe((prev) => !prev)}
                onResetView={handleResetView}
              />
            </GlassCard>
          </motion.div>

          {/* 3D Canvas */}
          <motion.div variants={itemVariants} className="flex-1">
            <div className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20">
              <div
                className="relative bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08]"
                style={{ height: '600px' }}
                aria-label="3D molecule viewer - interactive, use mouse to rotate and zoom"
                role="img"
              >
                <MoleculeCanvas
                  key={key}
                  molecule={selectedMolecule}
                  autoRotate={autoRotate}
                  wireframe={wireframe}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
