/**
 * Three.js scene wrapper that renders an interactive 3D molecule.
 * Marked `"use client"` because the entire `@react-three/fiber` canvas
 * lives in the browser and reads the live theme to swap the lighting
 * environment.
 */
"use client";

import React, { Suspense, useRef, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useTheme } from "next-themes";
import { Molecule } from "@/data/molecules";
import { MoleculeModel } from "./MoleculeModel";

/** Cached WebGL detection result; computed once on first client read. */
let webglSupportCache: boolean | null = null;

/**
 * Cheap WebGL feature detect. Returns true when the browser can create a
 * WebGL2 or WebGL rendering context, which the Three.js canvas requires.
 * The result is cached so the probe canvas is only created once.
 *
 * @returns True when a WebGL context is available, false otherwise.
 */
function detectWebGL(): boolean {
  if (webglSupportCache !== null) return webglSupportCache;
  try {
    const canvas = document.createElement("canvas");
    webglSupportCache = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webglSupportCache = false;
  }
  return webglSupportCache;
}

/**
 * `useSyncExternalStore` subscribe. WebGL support does not change at
 * runtime, so there is nothing to listen to; return a no-op unsubscribe.
 */
function subscribeWebGL(): () => void {
  return () => {};
}

/**
 * Client snapshot of WebGL availability. Returns null until the browser
 * detection has run on the client (it runs synchronously on first call),
 * matching the server snapshot to avoid a hydration mismatch.
 */
function getWebGLSnapshot(): boolean {
  return detectWebGL();
}

/** Server snapshot: WebGL is treated as unknown (null) during SSR. */
function getWebGLServerSnapshot(): boolean | null {
  return null;
}

/**
 * Hook that reports WebGL availability. Returns null on the server and
 * the first client paint, then a boolean once detection has run.
 *
 * @returns True/false when known, or null before the client probe.
 */
function useWebGLAvailable(): boolean | null {
  return useSyncExternalStore(subscribeWebGL, getWebGLSnapshot, getWebGLServerSnapshot);
}

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

  // Detect WebGL on the client only. Null means "not yet checked" (server
  // and first paint), which renders nothing to avoid a flash.
  const webglAvailable = useWebGLAvailable();

  if (webglAvailable === null) return null;

  if (!webglAvailable) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 24,
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: 13,
        }}
      >
        Visualisasi 3D tidak didukung di perangkat ini
      </div>
    );
  }

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
