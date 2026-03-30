"use client";

import { cn } from "@/lib/utils";
import { Molecule } from "@/data/molecules";
import { Atom } from "lucide-react";

interface MoleculeSelectorProps {
  molecules: Molecule[];
  selected: string;
  onSelect: (id: string) => void;
}

export function MoleculeSelector({ molecules, selected, onSelect }: MoleculeSelectorProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        Pilih Molekul
      </h2>
      <div className="space-y-1">
        {molecules.map((mol) => (
          <button
            key={mol.id}
            onClick={() => onSelect(mol.id)}
            aria-label={`Select molecule: ${mol.name}`}
            aria-pressed={selected === mol.id}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
              selected === mol.id
                ? "bg-white/70 dark:bg-white/[0.08] text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.06] border border-transparent"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg",
              selected === mol.id ? "bg-blue-500/10" : "bg-slate-500/10"
            )}>
              <Atom className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{mol.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{mol.formula}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
