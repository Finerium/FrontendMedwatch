export interface Atom {
  id: number;
  element: "C" | "H" | "O" | "N" | "S" | "Cl";
  label: string;
  position: [number, number, number];
}

export interface Bond {
  atom1: number;
  atom2: number;
  order: 1 | 2 | 3;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  description: string;
  atoms: Atom[];
  bonds: Bond[];
}

export const ATOM_COLORS: Record<string, string> = {
  C: "#6b7280",
  H: "#f9fafb",
  O: "#ef4444",
  N: "#3b82f6",
  S: "#eab308",
  Cl: "#22c55e",
};

export const ATOM_RADII: Record<string, number> = {
  C: 0.3,
  H: 0.2,
  O: 0.28,
  N: 0.28,
  S: 0.35,
  Cl: 0.32,
};

// ============================================================
// 1. ASPIRIN (Acetylsalicylic acid) -- C9H8O4 -- 21 atoms
// ============================================================
// Structure: Benzene ring with carboxyl group at C1 and
// acetyl ester (-O-CO-CH3) at C2.
//
// Benzene ring on XY plane centered near origin.
// Ring carbons at radius ~1.4 A from ring center.

const aspirin: Molecule = {
  id: "aspirin",
  name: "Aspirin",
  formula: "C\u2089H\u2088O\u2084",
  description: "Obat analgesik dan antipiretik yang umum digunakan untuk meredakan nyeri ringan hingga sedang, menurunkan demam, dan sebagai anti-inflamasi.",
  atoms: [
    // Benzene ring (C1-C6), ring center at origin, z=0
    { id: 1,  element: "C", label: "C1", position: [1.40,  0.00,  0.00] },
    { id: 2,  element: "C", label: "C2", position: [0.70,  1.21,  0.00] },
    { id: 3,  element: "C", label: "C3", position: [-0.70, 1.21,  0.00] },
    { id: 4,  element: "C", label: "C4", position: [-1.40, 0.00,  0.00] },
    { id: 5,  element: "C", label: "C5", position: [-0.70, -1.21, 0.00] },
    { id: 6,  element: "C", label: "C6", position: [0.70,  -1.21, 0.00] },

    // Carboxyl group on C1: C1-C7(=O1)(-O2H)
    { id: 7,  element: "C", label: "C7", position: [2.90,  0.00,  0.00] },
    { id: 8,  element: "O", label: "O1", position: [3.55,  1.07,  0.00] },
    { id: 9,  element: "O", label: "O2", position: [3.55, -1.07,  0.00] },
    { id: 10, element: "H", label: "H1", position: [4.52, -1.07,  0.00] },

    // Ester oxygen on C2: C2-O3-C8(=O4)-C9(H3)
    { id: 11, element: "O", label: "O3", position: [1.20,  2.55,  0.00] },
    { id: 12, element: "C", label: "C8", position: [0.50,  3.75,  0.00] },
    { id: 13, element: "O", label: "O4", position: [-0.72, 3.75,  0.00] },
    { id: 14, element: "C", label: "C9", position: [1.20,  5.05,  0.00] },

    // Hydrogens on methyl (C9)
    { id: 15, element: "H", label: "H2", position: [2.30,  4.95,  0.00] },
    { id: 16, element: "H", label: "H3", position: [0.85,  5.60,  0.89] },
    { id: 17, element: "H", label: "H4", position: [0.85,  5.60, -0.89] },

    // Aromatic H on C3, C4, C5, C6
    { id: 18, element: "H", label: "H5", position: [-1.24, 2.15,  0.00] },
    { id: 19, element: "H", label: "H6", position: [-2.49, 0.00,  0.00] },
    { id: 20, element: "H", label: "H7", position: [-1.24, -2.15, 0.00] },
    { id: 21, element: "H", label: "H8", position: [1.24,  -2.15, 0.00] },
  ],
  bonds: [
    // Benzene ring (alternating single/double)
    { atom1: 1,  atom2: 2,  order: 2 },
    { atom1: 2,  atom2: 3,  order: 1 },
    { atom1: 3,  atom2: 4,  order: 2 },
    { atom1: 4,  atom2: 5,  order: 1 },
    { atom1: 5,  atom2: 6,  order: 2 },
    { atom1: 6,  atom2: 1,  order: 1 },

    // Carboxyl on C1
    { atom1: 1,  atom2: 7,  order: 1 },
    { atom1: 7,  atom2: 8,  order: 2 },
    { atom1: 7,  atom2: 9,  order: 1 },
    { atom1: 9,  atom2: 10, order: 1 },

    // Ester on C2
    { atom1: 2,  atom2: 11, order: 1 },
    { atom1: 11, atom2: 12, order: 1 },
    { atom1: 12, atom2: 13, order: 2 },
    { atom1: 12, atom2: 14, order: 1 },

    // Methyl H
    { atom1: 14, atom2: 15, order: 1 },
    { atom1: 14, atom2: 16, order: 1 },
    { atom1: 14, atom2: 17, order: 1 },

    // Aromatic H
    { atom1: 3,  atom2: 18, order: 1 },
    { atom1: 4,  atom2: 19, order: 1 },
    { atom1: 5,  atom2: 20, order: 1 },
    { atom1: 6,  atom2: 21, order: 1 },
  ],
};

// ============================================================
// 2. PARACETAMOL (Acetaminophen) -- C8H9NO2 -- 20 atoms
// ============================================================
// Structure: Benzene ring with hydroxyl (-OH) at C1 (para)
// and acetamide (-NH-CO-CH3) at C4.

const paracetamol: Molecule = {
  id: "paracetamol",
  name: "Paracetamol",
  formula: "C\u2088H\u2089NO\u2082",
  description: "Analgesik dan antipiretik paling umum digunakan di seluruh dunia untuk meredakan nyeri dan menurunkan demam tanpa efek anti-inflamasi signifikan.",
  atoms: [
    // Benzene ring (C1-C6), ring center at origin
    { id: 1,  element: "C", label: "C1", position: [0.00,  1.40,  0.00] },
    { id: 2,  element: "C", label: "C2", position: [1.21,  0.70,  0.00] },
    { id: 3,  element: "C", label: "C3", position: [1.21, -0.70,  0.00] },
    { id: 4,  element: "C", label: "C4", position: [0.00, -1.40,  0.00] },
    { id: 5,  element: "C", label: "C5", position: [-1.21, -0.70, 0.00] },
    { id: 6,  element: "C", label: "C6", position: [-1.21,  0.70, 0.00] },

    // Hydroxyl on C1 (para position top)
    { id: 7,  element: "O", label: "O1", position: [0.00,  2.78,  0.00] },
    { id: 8,  element: "H", label: "H1", position: [0.00,  3.74,  0.00] },

    // Acetamide on C4: C4-N-H, N-C7(=O2)-C8(H3)
    { id: 9,  element: "N", label: "N1", position: [0.00, -2.85,  0.00] },
    { id: 10, element: "H", label: "H2", position: [0.87, -3.32,  0.00] },
    { id: 11, element: "C", label: "C7", position: [-0.90, -3.90, 0.00] },
    { id: 12, element: "O", label: "O2", position: [-2.12, -3.65, 0.00] },
    { id: 13, element: "C", label: "C8", position: [-0.35, -5.30, 0.00] },

    // Methyl H on C8
    { id: 14, element: "H", label: "H3", position: [0.75,  -5.35, 0.00] },
    { id: 15, element: "H", label: "H4", position: [-0.73, -5.85, 0.89] },
    { id: 16, element: "H", label: "H5", position: [-0.73, -5.85, -0.89] },

    // Aromatic H on C2, C3, C5, C6
    { id: 17, element: "H", label: "H6", position: [2.15,  1.24,  0.00] },
    { id: 18, element: "H", label: "H7", position: [2.15, -1.24,  0.00] },
    { id: 19, element: "H", label: "H8", position: [-2.15, -1.24, 0.00] },
    { id: 20, element: "H", label: "H9", position: [-2.15,  1.24, 0.00] },
  ],
  bonds: [
    // Benzene ring
    { atom1: 1,  atom2: 2,  order: 2 },
    { atom1: 2,  atom2: 3,  order: 1 },
    { atom1: 3,  atom2: 4,  order: 2 },
    { atom1: 4,  atom2: 5,  order: 1 },
    { atom1: 5,  atom2: 6,  order: 2 },
    { atom1: 6,  atom2: 1,  order: 1 },

    // Hydroxyl on C1
    { atom1: 1,  atom2: 7,  order: 1 },
    { atom1: 7,  atom2: 8,  order: 1 },

    // Acetamide on C4
    { atom1: 4,  atom2: 9,  order: 1 },
    { atom1: 9,  atom2: 10, order: 1 },
    { atom1: 9,  atom2: 11, order: 1 },
    { atom1: 11, atom2: 12, order: 2 },
    { atom1: 11, atom2: 13, order: 1 },

    // Methyl H
    { atom1: 13, atom2: 14, order: 1 },
    { atom1: 13, atom2: 15, order: 1 },
    { atom1: 13, atom2: 16, order: 1 },

    // Aromatic H
    { atom1: 2,  atom2: 17, order: 1 },
    { atom1: 3,  atom2: 18, order: 1 },
    { atom1: 5,  atom2: 19, order: 1 },
    { atom1: 6,  atom2: 20, order: 1 },
  ],
};

// ============================================================
// 3. IBUPROFEN -- C13H18O2 -- 33 atoms
// ============================================================
// Structure: Benzene ring with para-isobutyl group and
// alpha-methyl propionic acid.
//
// Ring in XY plane. Propionic acid extends in +X, isobutyl in -X.

const ibuprofen: Molecule = {
  id: "ibuprofen",
  name: "Ibuprofen",
  formula: "C\u2081\u2083H\u2081\u2088O\u2082",
  description: "Obat anti-inflamasi nonsteroid (NSAID) yang digunakan untuk mengatasi nyeri, demam, dan peradangan termasuk arthritis dan nyeri otot.",
  atoms: [
    // Benzene ring C1-C6
    { id: 1,  element: "C", label: "C1",  position: [1.40,   0.00,  0.00] },
    { id: 2,  element: "C", label: "C2",  position: [0.70,   1.21,  0.00] },
    { id: 3,  element: "C", label: "C3",  position: [-0.70,  1.21,  0.00] },
    { id: 4,  element: "C", label: "C4",  position: [-1.40,  0.00,  0.00] },
    { id: 5,  element: "C", label: "C5",  position: [-0.70, -1.21,  0.00] },
    { id: 6,  element: "C", label: "C6",  position: [0.70,  -1.21,  0.00] },

    // Propionic acid chain on C1: C1-C7(H,CH3)-C8(=O1)(-O2H)
    { id: 7,  element: "C", label: "C7",  position: [2.90,   0.00,  0.00] },
    { id: 8,  element: "C", label: "C8",  position: [3.55,  -1.30,  0.00] },
    { id: 9,  element: "O", label: "O1",  position: [3.05,  -2.40,  0.00] },
    { id: 10, element: "O", label: "O2",  position: [4.90,  -1.20,  0.00] },
    { id: 11, element: "H", label: "H1",  position: [5.35,  -2.05,  0.00] },
    { id: 12, element: "C", label: "C9",  position: [3.50,   1.25,  0.50] },
    { id: 13, element: "H", label: "H2",  position: [3.10,   0.00, -1.09] },

    // Isobutyl on C4: C4-C10(H2)-C11(H)-C12(H3) + C13(H3)
    { id: 14, element: "C", label: "C10", position: [-2.90,  0.00,  0.00] },
    { id: 15, element: "C", label: "C11", position: [-3.65,  1.30,  0.00] },
    { id: 16, element: "C", label: "C12", position: [-3.05,  2.55,  0.70] },
    { id: 17, element: "C", label: "C13", position: [-5.15,  1.20,  0.00] },

    // Hydrogens on methyl C9 (on C7)
    { id: 18, element: "H", label: "H3",  position: [4.60,   1.20,  0.50] },
    { id: 19, element: "H", label: "H4",  position: [3.15,   2.10, -0.07] },
    { id: 20, element: "H", label: "H5",  position: [3.15,   1.35,  1.55] },

    // Hydrogens on C10
    { id: 21, element: "H", label: "H6",  position: [-3.20, -0.55,  0.89] },
    { id: 22, element: "H", label: "H7",  position: [-3.20, -0.55, -0.89] },

    // H on C11
    { id: 23, element: "H", label: "H8",  position: [-3.35,  1.75, -1.00] },

    // Hydrogens on C12
    { id: 24, element: "H", label: "H9",  position: [-1.92,  2.60,  0.70] },
    { id: 25, element: "H", label: "H10", position: [-3.45,  3.45,  0.22] },
    { id: 26, element: "H", label: "H11", position: [-3.40,  2.55,  1.74] },

    // Hydrogens on C13
    { id: 27, element: "H", label: "H12", position: [-5.55,  0.22,  0.22] },
    { id: 28, element: "H", label: "H13", position: [-5.55,  1.95, -0.68] },
    { id: 29, element: "H", label: "H14", position: [-5.55,  1.40,  1.01] },

    // Aromatic H on C2, C3, C5, C6
    { id: 30, element: "H", label: "H15", position: [1.24,   2.15,  0.00] },
    { id: 31, element: "H", label: "H16", position: [-1.24,  2.15,  0.00] },
    { id: 32, element: "H", label: "H17", position: [-1.24, -2.15,  0.00] },
    { id: 33, element: "H", label: "H18", position: [1.24,  -2.15,  0.00] },
  ],
  bonds: [
    // Benzene ring
    { atom1: 1,  atom2: 2,  order: 2 },
    { atom1: 2,  atom2: 3,  order: 1 },
    { atom1: 3,  atom2: 4,  order: 2 },
    { atom1: 4,  atom2: 5,  order: 1 },
    { atom1: 5,  atom2: 6,  order: 2 },
    { atom1: 6,  atom2: 1,  order: 1 },

    // Propionic acid on C1
    { atom1: 1,  atom2: 7,  order: 1 },
    { atom1: 7,  atom2: 8,  order: 1 },
    { atom1: 8,  atom2: 9,  order: 2 },
    { atom1: 8,  atom2: 10, order: 1 },
    { atom1: 10, atom2: 11, order: 1 },
    { atom1: 7,  atom2: 12, order: 1 },
    { atom1: 7,  atom2: 13, order: 1 },

    // Isobutyl on C4
    { atom1: 4,  atom2: 14, order: 1 },
    { atom1: 14, atom2: 15, order: 1 },
    { atom1: 15, atom2: 16, order: 1 },
    { atom1: 15, atom2: 17, order: 1 },

    // H on methyls, CH2, CH
    { atom1: 12, atom2: 18, order: 1 },
    { atom1: 12, atom2: 19, order: 1 },
    { atom1: 12, atom2: 20, order: 1 },
    { atom1: 14, atom2: 21, order: 1 },
    { atom1: 14, atom2: 22, order: 1 },
    { atom1: 15, atom2: 23, order: 1 },
    { atom1: 16, atom2: 24, order: 1 },
    { atom1: 16, atom2: 25, order: 1 },
    { atom1: 16, atom2: 26, order: 1 },
    { atom1: 17, atom2: 27, order: 1 },
    { atom1: 17, atom2: 28, order: 1 },
    { atom1: 17, atom2: 29, order: 1 },

    // Aromatic H
    { atom1: 2,  atom2: 30, order: 1 },
    { atom1: 3,  atom2: 31, order: 1 },
    { atom1: 5,  atom2: 32, order: 1 },
    { atom1: 6,  atom2: 33, order: 1 },
  ],
};

// ============================================================
// 4. CAFFEINE -- C8H10N4O2 -- 24 atoms
// ============================================================
// Structure: Fused purine ring system (pyrimidine + imidazole)
// with three methyl groups (on N1, N3, N7) and two C=O groups.
//
// Numbering follows IUPAC purine numbering.
// Pyrimidine ring: N1-C2-N3-C4-C5-C6 (6-membered)
// Imidazole ring:  C4-C5-N7-C8-N9     (5-membered, shares C4-C5 edge)

const caffeine: Molecule = {
  id: "caffeine",
  name: "Caffeine",
  formula: "C\u2088H\u2081\u2080N\u2084O\u2082",
  description: "Stimulan sistem saraf pusat yang ditemukan dalam kopi, teh, dan cokelat. Digunakan secara medis untuk meningkatkan efektivitas analgesik.",
  atoms: [
    // Pyrimidine ring (6-membered)
    { id: 1,  element: "N", label: "N1", position: [-1.23,  1.43,  0.00] },
    { id: 2,  element: "C", label: "C1", position: [0.00,   2.03,  0.00] },
    { id: 3,  element: "N", label: "N2", position: [1.17,   1.33,  0.00] },
    { id: 4,  element: "C", label: "C2", position: [1.12,  -0.05,  0.00] },
    { id: 5,  element: "C", label: "C3", position: [-0.12, -0.72,  0.00] },
    { id: 6,  element: "C", label: "C4", position: [-1.30,  0.05,  0.00] },

    // Imidazole ring (5-membered, fused at C2-C3)
    { id: 7,  element: "N", label: "N3", position: [-0.36, -2.08,  0.00] },
    { id: 8,  element: "C", label: "C5", position: [0.78,  -2.73,  0.00] },
    { id: 9,  element: "N", label: "N4", position: [1.78,  -1.82,  0.00] },

    // C=O groups
    { id: 10, element: "O", label: "O1", position: [0.06,   3.26,  0.00] },
    { id: 11, element: "O", label: "O2", position: [-2.40, -0.49,  0.00] },

    // Methyl on N1
    { id: 12, element: "C", label: "C6",  position: [-2.45,  2.22, 0.00] },
    { id: 13, element: "H", label: "H1",  position: [-2.30,  3.30, 0.00] },
    { id: 14, element: "H", label: "H2",  position: [-3.05,  1.95, 0.87] },
    { id: 15, element: "H", label: "H3",  position: [-3.05,  1.95, -0.87] },

    // Methyl on N2
    { id: 16, element: "C", label: "C7",  position: [2.40,   2.03, 0.00] },
    { id: 17, element: "H", label: "H4",  position: [2.40,   3.12, 0.00] },
    { id: 18, element: "H", label: "H5",  position: [2.95,   1.65, 0.87] },
    { id: 19, element: "H", label: "H6",  position: [2.95,   1.65, -0.87] },

    // Methyl on N3
    { id: 20, element: "C", label: "C8",  position: [-1.60, -2.82, 0.00] },
    { id: 21, element: "H", label: "H7",  position: [-1.45, -3.90, 0.00] },
    { id: 22, element: "H", label: "H8",  position: [-2.20, -2.55, 0.87] },
    { id: 23, element: "H", label: "H9",  position: [-2.20, -2.55, -0.87] },

    // H on C5 (imidazole)
    { id: 24, element: "H", label: "H10", position: [0.85,  -3.81, 0.00] },
  ],
  bonds: [
    // Pyrimidine ring
    { atom1: 1,  atom2: 2,  order: 1 },
    { atom1: 2,  atom2: 3,  order: 1 },
    { atom1: 3,  atom2: 4,  order: 1 },
    { atom1: 4,  atom2: 5,  order: 2 },
    { atom1: 5,  atom2: 6,  order: 1 },
    { atom1: 6,  atom2: 1,  order: 1 },

    // Imidazole ring (fused at C2-C3, atoms 4-5)
    { atom1: 5,  atom2: 7,  order: 1 },
    { atom1: 7,  atom2: 8,  order: 1 },
    { atom1: 8,  atom2: 9,  order: 2 },
    { atom1: 9,  atom2: 4,  order: 1 },

    // Carbonyls
    { atom1: 2,  atom2: 10, order: 2 },
    { atom1: 6,  atom2: 11, order: 2 },

    // Methyl on N1
    { atom1: 1,  atom2: 12, order: 1 },
    { atom1: 12, atom2: 13, order: 1 },
    { atom1: 12, atom2: 14, order: 1 },
    { atom1: 12, atom2: 15, order: 1 },

    // Methyl on N2
    { atom1: 3,  atom2: 16, order: 1 },
    { atom1: 16, atom2: 17, order: 1 },
    { atom1: 16, atom2: 18, order: 1 },
    { atom1: 16, atom2: 19, order: 1 },

    // Methyl on N3
    { atom1: 7,  atom2: 20, order: 1 },
    { atom1: 20, atom2: 21, order: 1 },
    { atom1: 20, atom2: 22, order: 1 },
    { atom1: 20, atom2: 23, order: 1 },

    // H on C5
    { atom1: 8,  atom2: 24, order: 1 },
  ],
};

// ============================================================
// 5. AMOXICILLIN -- C16H19N3O5S -- 44 atoms
// ============================================================
// Structure: Beta-lactam (4-membered ring) fused with thiazolidine
// (5-membered ring containing S and N). Attached phenol ring with
// para-hydroxyl and alpha-amino group. Carboxyl on thiazolidine C.
//
// Penam bicyclic system centered near origin.
// Thiazolidine (5): S1-C1(gem-dimethyl)-C2-N1-C3
// Beta-lactam  (4): N1-C2-C4(=O)-C5-N1
// C5 has acylamino side chain leading to 4-hydroxyphenyl.
// C1 has -COOH.

const amoxicillin: Molecule = {
  id: "amoxicillin",
  name: "Amoxicillin",
  formula: "C\u2081\u2086H\u2081\u2089N\u2083O\u2085S",
  description: "Antibiotik beta-laktam spektrum luas yang digunakan untuk mengobati berbagai infeksi bakteri termasuk infeksi saluran pernapasan dan saluran kemih.",
  atoms: [
    // ---- Thiazolidine ring ----
    { id: 1,  element: "S",  label: "S1",  position: [-0.80,  1.60,  0.30] },
    { id: 2,  element: "C",  label: "C1",  position: [-2.10,  0.40,  0.00] },
    { id: 3,  element: "C",  label: "C2",  position: [-1.30, -0.80, -0.40] },
    { id: 4,  element: "N",  label: "N1",  position: [0.10,  -0.50, -0.30] },
    { id: 5,  element: "C",  label: "C3",  position: [0.60,   0.80,  0.10] },

    // ---- Beta-lactam ring (4-membered) ----
    { id: 6,  element: "C",  label: "C4",  position: [-1.45, -2.10,  0.40] },
    { id: 7,  element: "C",  label: "C5",  position: [0.00,  -1.80,  0.50] },
    { id: 8,  element: "O",  label: "O1",  position: [-2.30, -3.00,  0.70] },

    // ---- COOH on C1 ----
    { id: 9,  element: "C",  label: "C6",  position: [-3.30,  0.20,  1.00] },
    { id: 10, element: "O",  label: "O2",  position: [-3.20,  0.55,  2.18] },
    { id: 11, element: "O",  label: "O3",  position: [-4.40, -0.25,  0.45] },
    { id: 12, element: "H",  label: "H1",  position: [-5.15, -0.35,  1.05] },

    // ---- Gem-dimethyl on C1 ----
    { id: 13, element: "C",  label: "C7",  position: [-2.75,  0.70, -1.40] },
    { id: 14, element: "C",  label: "C8",  position: [-3.10,  1.50,  0.50] },

    // ---- Acylamino side chain on C5 ----
    // C5-NH-CO-CH(NH2)-phenol
    { id: 15, element: "N",  label: "N2",  position: [0.70,  -2.60,  1.40] },
    { id: 16, element: "H",  label: "H2",  position: [0.30,  -2.50,  2.30] },
    { id: 17, element: "C",  label: "C9",  position: [2.00,  -3.10,  1.20] },
    { id: 18, element: "O",  label: "O4",  position: [2.50,  -3.10,  0.08] },
    { id: 19, element: "C",  label: "C10", position: [2.80,  -3.65,  2.40] },
    { id: 20, element: "N",  label: "N3",  position: [2.30,  -5.00,  2.80] },
    { id: 21, element: "H",  label: "H3",  position: [1.30,  -5.10,  2.70] },
    { id: 22, element: "H",  label: "H4",  position: [2.80,  -5.70,  2.30] },
    { id: 23, element: "H",  label: "H5",  position: [2.60,  -3.00,  3.25] },

    // ---- Phenol ring (4-hydroxyphenyl) ----
    { id: 24, element: "C",  label: "C11", position: [4.30,  -3.65,  2.20] },
    { id: 25, element: "C",  label: "C12", position: [5.05,  -2.50,  2.50] },
    { id: 26, element: "C",  label: "C13", position: [6.43,  -2.50,  2.35] },
    { id: 27, element: "C",  label: "C14", position: [7.08,  -3.65,  1.90] },
    { id: 28, element: "C",  label: "C15", position: [6.33,  -4.80,  1.60] },
    { id: 29, element: "C",  label: "C16", position: [4.95,  -4.80,  1.75] },

    // para-OH on C14
    { id: 30, element: "O",  label: "O5",  position: [8.43,  -3.65,  1.76] },
    { id: 31, element: "H",  label: "H6",  position: [8.85,  -4.45,  1.45] },

    // Aromatic H on phenol (C12, C13, C15, C16)
    { id: 32, element: "H",  label: "H7",  position: [4.55,  -1.60,  2.85] },
    { id: 33, element: "H",  label: "H8",  position: [7.00,  -1.60,  2.58] },
    { id: 34, element: "H",  label: "H9",  position: [6.83,  -5.70,  1.25] },
    { id: 35, element: "H",  label: "H10", position: [4.38,  -5.70,  1.52] },

    // ---- Remaining hydrogens ----
    { id: 36, element: "H",  label: "H11", position: [-1.55, -1.05, -1.46] },
    { id: 37, element: "H",  label: "H12", position: [1.10,   0.85,  1.09] },
    { id: 38, element: "H",  label: "H13", position: [0.40,  -2.15, -0.40] },

    // Methyl a (C7) hydrogens
    { id: 39, element: "H",  label: "H14", position: [-3.55,   1.45, -1.40] },
    { id: 40, element: "H",  label: "H15", position: [-1.95,   0.90, -2.10] },
    { id: 41, element: "H",  label: "H16", position: [-3.10,  -0.25, -1.75] },

    // Methyl b (C8) hydrogens
    { id: 42, element: "H",  label: "H17", position: [-3.90,   2.10,  0.10] },
    { id: 43, element: "H",  label: "H18", position: [-3.50,   1.35,  1.50] },
    { id: 44, element: "H",  label: "H19", position: [-2.40,   2.30,  0.60] },
  ],
  bonds: [
    // Thiazolidine ring (5-membered): S1-C3-N1-C2-C1-S1
    { atom1: 1,  atom2: 5,  order: 1 },
    { atom1: 5,  atom2: 4,  order: 1 },
    { atom1: 4,  atom2: 3,  order: 1 },
    { atom1: 3,  atom2: 2,  order: 1 },
    { atom1: 2,  atom2: 1,  order: 1 },

    // Beta-lactam ring (4-membered): N1-C2-C4-C5-N1
    { atom1: 3,  atom2: 6,  order: 1 },
    { atom1: 6,  atom2: 7,  order: 1 },
    { atom1: 7,  atom2: 4,  order: 1 },
    { atom1: 6,  atom2: 8,  order: 2 },

    // COOH on C1
    { atom1: 2,  atom2: 9,  order: 1 },
    { atom1: 9,  atom2: 10, order: 2 },
    { atom1: 9,  atom2: 11, order: 1 },
    { atom1: 11, atom2: 12, order: 1 },

    // Gem-dimethyl on C1
    { atom1: 2,  atom2: 13, order: 1 },
    { atom1: 2,  atom2: 14, order: 1 },

    // Acylamino side chain on C5
    { atom1: 7,  atom2: 15, order: 1 },
    { atom1: 15, atom2: 16, order: 1 },
    { atom1: 15, atom2: 17, order: 1 },
    { atom1: 17, atom2: 18, order: 2 },
    { atom1: 17, atom2: 19, order: 1 },
    { atom1: 19, atom2: 20, order: 1 },
    { atom1: 20, atom2: 21, order: 1 },
    { atom1: 20, atom2: 22, order: 1 },
    { atom1: 19, atom2: 23, order: 1 },

    // Phenol ring
    { atom1: 19, atom2: 24, order: 1 },
    { atom1: 24, atom2: 25, order: 2 },
    { atom1: 25, atom2: 26, order: 1 },
    { atom1: 26, atom2: 27, order: 2 },
    { atom1: 27, atom2: 28, order: 1 },
    { atom1: 28, atom2: 29, order: 2 },
    { atom1: 29, atom2: 24, order: 1 },

    // para-OH
    { atom1: 27, atom2: 30, order: 1 },
    { atom1: 30, atom2: 31, order: 1 },

    // Aromatic H on phenol
    { atom1: 25, atom2: 32, order: 1 },
    { atom1: 26, atom2: 33, order: 1 },
    { atom1: 28, atom2: 34, order: 1 },
    { atom1: 29, atom2: 35, order: 1 },

    // H on ring carbons
    { atom1: 3,  atom2: 36, order: 1 },
    { atom1: 5,  atom2: 37, order: 1 },
    { atom1: 7,  atom2: 38, order: 1 },

    // Methyl a (C7) H
    { atom1: 13, atom2: 39, order: 1 },
    { atom1: 13, atom2: 40, order: 1 },
    { atom1: 13, atom2: 41, order: 1 },

    // Methyl b (C8) H
    { atom1: 14, atom2: 42, order: 1 },
    { atom1: 14, atom2: 43, order: 1 },
    { atom1: 14, atom2: 44, order: 1 },
  ],
};

// ============================================================
// Export all molecules
// ============================================================

export const molecules: Molecule[] = [
  aspirin,
  paracetamol,
  ibuprofen,
  caffeine,
  amoxicillin,
];
