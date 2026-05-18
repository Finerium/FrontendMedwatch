/**
 * Three.js scene wrapper that renders an interactive 3D molecule.
 * Marked `"use client"` because the entire `@react-three/fiber` canvas
 * lives in the browser and reads the live theme to swap the lighting
 * environment.
 */
"use client";

import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useTheme } from "next-themes";
import { Molecule } from "@/data/molecules";
import { MoleculeModel } from "./MoleculeModel";

interface MoleculeCanvasProps {
  /** Molecule definition (atoms + bonds) to render. */
  molecule: Molecule;
  /** Whether to spin the scene automatically. */
  autoRotate: boolean;
  /** Whether to render bonds as wireframes. */
  wireframe: boolean;
}

/**
 * Inner canvas implementation; the public export wraps it in `React.memo`
 * so the Three.js scene does not rebuild when an unrelated prop changes
 * on the parent.
 *
 * @param props - See `MoleculeCanvasProps`.
 */
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

/**
 * Public memoised canvas component. Re-renders only when the molecule
 * or one of the two boolean controls changes.
 */
export const MoleculeCanvas = React.memo(MoleculeCanvasInner);
export default MoleculeCanvas;
