"use client";

import { useMemo } from "react";
import { Molecule, ATOM_COLORS } from "@/data/molecules";

interface MoleculeInfoProps {
  molecule: Molecule;
}

export function MoleculeInfo({ molecule }: MoleculeInfoProps) {
  const stats = useMemo(() => {
    const elementCounts: Record<string, number> = {};
    molecule.atoms.forEach((atom) => {
      elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
    });

    const bondCounts = { single: 0, double: 0, triple: 0 };
    molecule.bonds.forEach((bond) => {
      if (bond.order === 1) bondCounts.single++;
      if (bond.order === 2) bondCounts.double++;
      if (bond.order === 3) bondCounts.triple++;
    });

    return { elementCounts, bondCounts };
  }, [molecule]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{molecule.name}</h2>
        <p className="text-sm font-mono text-blue-600 dark:text-blue-400 mt-0.5">{molecule.formula}</p>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {molecule.description}
      </p>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Komposisi Atom
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.elementCounts).map(([element, count]) => (
            <span
              key={element}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.05]"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: ATOM_COLORS[element] || "#94a3b8" }}
              />
              {element}: {count}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Ikatan
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="px-2 py-1.5 rounded-lg bg-white/50 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-50">{stats.bondCounts.single}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Tunggal</p>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-white/50 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">{stats.bondCounts.double}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Ganda</p>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-white/50 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-lg font-bold font-mono text-pink-600 dark:text-pink-400">{stats.bondCounts.triple}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Rangkap 3</p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Total atom</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{molecule.atoms.length}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>Total ikatan</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{molecule.bonds.length}</span>
        </div>
      </div>
    </div>
  );
}
