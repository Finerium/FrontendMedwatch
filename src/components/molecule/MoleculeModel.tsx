"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Molecule, ATOM_COLORS, ATOM_RADII } from "@/data/molecules";

interface MoleculeModelProps {
  molecule: Molecule;
  autoRotate: boolean;
  wireframe: boolean;
}

export function MoleculeModel({ molecule, autoRotate, wireframe }: MoleculeModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);
  const isDragging = useRef(false);

  const SCALE = 2.0;

  useFrame((state, delta) => {
    if (groupRef.current && autoRotate && !isDragging.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
    // Force continuous rendering to prevent canvas from freezing
    state.invalidate();
  });

  const atomMap = useMemo(() => {
    const map = new Map<number, [number, number, number]>();
    molecule.atoms.forEach((atom) => {
      map.set(atom.id, [
        atom.position[0] * SCALE,
        atom.position[1] * SCALE,
        atom.position[2] * SCALE,
      ]);
    });
    return map;
  }, [molecule]);

  return (
    <group
      ref={groupRef}
      onPointerDown={() => { isDragging.current = true; }}
      onPointerUp={() => { isDragging.current = false; }}
    >
      {/* Atoms */}
      {molecule.atoms.map((atom) => {
        const pos = atomMap.get(atom.id)!;
        const color = ATOM_COLORS[atom.element] || "#94a3b8";
        const radius = (ATOM_RADII[atom.element] || 0.3) * (wireframe ? 0.15 : 1);
        const isHovered = hoveredAtom === atom.id;

        return (
          <mesh
            key={`atom-${atom.id}`}
            position={pos}
            scale={isHovered ? 1.3 : 1}
            onPointerEnter={(e) => { e.stopPropagation(); setHoveredAtom(atom.id); }}
            onPointerLeave={() => setHoveredAtom(null)}
          >
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial
              color={color}
              roughness={0.3}
              metalness={0.2}
              wireframe={wireframe}
              emissive={isHovered ? color : "#000000"}
              emissiveIntensity={isHovered ? 0.4 : 0}
            />
            {isHovered && (
              <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
                <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-3 py-2 text-xs whitespace-nowrap">
                  <p className="font-bold text-slate-900 dark:text-white">{atom.element} - {atom.label}</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    ({atom.position[0].toFixed(2)}, {atom.position[1].toFixed(2)}, {atom.position[2].toFixed(2)}) Å
                  </p>
                </div>
              </Html>
            )}
          </mesh>
        );
      })}

      {/* Bonds */}
      {molecule.bonds.map((bond, idx) => {
        const posA = atomMap.get(bond.atom1);
        const posB = atomMap.get(bond.atom2);
        if (!posA || !posB) return null;

        const vecA = new THREE.Vector3(...posA);
        const vecB = new THREE.Vector3(...posB);
        const direction = new THREE.Vector3().subVectors(vecB, vecA);
        const midpoint = new THREE.Vector3().addVectors(vecA, vecB).multiplyScalar(0.5);
        const length = direction.length();

        // Calculate orientation
        const orientation = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        orientation.setFromUnitVectors(up, direction.clone().normalize());

        if (bond.order === 1) {
          const bondRadius = wireframe ? 0.02 : 0.08;
          return (
            <mesh key={`bond-${idx}`} position={midpoint} quaternion={orientation}>
              <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} wireframe={wireframe} />
            </mesh>
          );
        }

        if (bond.order === 2) {
          const bondRadius = wireframe ? 0.015 : 0.06;
          const offset = 0.12 * SCALE * 0.5;
          // Get perpendicular vector for offset
          const perp = new THREE.Vector3();
          if (Math.abs(direction.x) < 0.9) {
            perp.crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize();
          } else {
            perp.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
          }
          const offset1 = perp.clone().multiplyScalar(offset);
          const offset2 = perp.clone().multiplyScalar(-offset);

          return (
            <group key={`bond-${idx}`}>
              <mesh position={midpoint.clone().add(offset1)} quaternion={orientation}>
                <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} wireframe={wireframe} />
              </mesh>
              <mesh position={midpoint.clone().add(offset2)} quaternion={orientation}>
                <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} wireframe={wireframe} />
              </mesh>
            </group>
          );
        }

        if (bond.order === 3) {
          const bondRadius = wireframe ? 0.012 : 0.05;
          const offset = 0.14 * SCALE * 0.5;
          const perp = new THREE.Vector3();
          if (Math.abs(direction.x) < 0.9) {
            perp.crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize();
          } else {
            perp.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
          }
          const offset1 = perp.clone().multiplyScalar(offset);
          const offset2 = perp.clone().multiplyScalar(-offset);

          return (
            <group key={`bond-${idx}`}>
              <mesh position={midpoint} quaternion={orientation}>
                <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} wireframe={wireframe} />
              </mesh>
              <mesh position={midpoint.clone().add(offset1)} quaternion={orientation}>
                <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} wireframe={wireframe} />
              </mesh>
              <mesh position={midpoint.clone().add(offset2)} quaternion={orientation}>
                <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} wireframe={wireframe} />
              </mesh>
            </group>
          );
        }

        return null;
      })}
    </group>
  );
}
