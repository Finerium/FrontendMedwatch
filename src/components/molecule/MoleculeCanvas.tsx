"use client";

import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useTheme } from "next-themes";
import { Molecule } from "@/data/molecules";
import { MoleculeModel } from "./MoleculeModel";

interface MoleculeCanvasProps {
  molecule: Molecule;
  autoRotate: boolean;
  wireframe: boolean;
}

function MoleculeCanvasInner({ molecule, autoRotate, wireframe }: MoleculeCanvasProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 18], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "default" }}
      style={{ background: isDark ? "transparent" : "#f8fafc" }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
    >
      <ambientLight intensity={isDark ? 0.4 : 0.7} />
      <pointLight position={[10, 10, 10]} intensity={isDark ? 1 : 1.2} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={isDark ? "#a78bfa" : "#93c5fd"} />
      <Suspense fallback={null}>
        <MoleculeModel molecule={molecule} autoRotate={autoRotate} wireframe={wireframe} />
        <Environment preset={isDark ? "night" : "studio"} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enableRotate={true}
        enablePan={true}
        minDistance={5}
        maxDistance={35}
      />
    </Canvas>
  );
}

export const MoleculeCanvas = React.memo(MoleculeCanvasInner);
export default MoleculeCanvas;
