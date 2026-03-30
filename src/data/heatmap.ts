export interface HeatmapCell {
  drugName: string;
  sideEffect: string;
  frequency: number; // 0-100 percentage
  severity: "mild" | "moderate" | "severe";
}

export interface HeatmapData {
  drugs: string[];
  sideEffects: string[];
  matrix: number[][];
  severities: ("mild" | "moderate" | "severe")[][];
}

function getSeverity(frequency: number): "mild" | "moderate" | "severe" {
  if (frequency <= 30) return "mild";
  if (frequency <= 60) return "moderate";
  return "severe";
}

function buildSeverities(matrix: number[][]): ("mild" | "moderate" | "severe")[][] {
  return matrix.map((row) => row.map((freq) => getSeverity(freq)));
}

// Drug order (rows):
//  0: Aspirin
//  1: Paracetamol
//  2: Ibuprofen
//  3: Amoxicillin
//  4: Ciprofloxacin
//  5: Metformin
//  6: Omeprazole
//  7: Captopril
//  8: Diclofenac
//  9: Cetirizine
// 10: Dexamethasone
// 11: Ranitidine

// Side effect order (columns):
//  0: Mual
//  1: Pusing
//  2: Diare
//  3: Ruam Kulit
//  4: Sakit Kepala
//  5: Nyeri Lambung
//  6: Kantuk
//  7: Insomnia
//  8: Batuk Kering
//  9: Kelelahan
// 10: Mulut Kering
// 11: Tremor

const drugs: string[] = [
  "Aspirin",
  "Paracetamol",
  "Ibuprofen",
  "Amoxicillin",
  "Ciprofloxacin",
  "Metformin",
  "Omeprazole",
  "Captopril",
  "Diclofenac",
  "Cetirizine",
  "Dexamethasone",
  "Ranitidine",
];

const sideEffects: string[] = [
  "Mual",
  "Pusing",
  "Diare",
  "Ruam Kulit",
  "Sakit Kepala",
  "Nyeri Lambung",
  "Kantuk",
  "Insomnia",
  "Batuk Kering",
  "Kelelahan",
  "Mulut Kering",
  "Tremor",
];

// matrix[drugIndex][sideEffectIndex] = frequency (0-100)
const matrix: number[][] = [
  // Aspirin:        Mual  Pusing Diare RuamK SakitK NyeriL Kantuk Insom  BatukK Kelel  MulutK Tremor
  /* Aspirin      */ [35,   15,    8,    5,     20,    75,    3,     5,     0,     12,    0,     0],
  // Paracetamol:   Generally well-tolerated, low side effect profile
  /* Paracetamol  */ [8,    5,     2,    10,    4,     3,     5,     3,     0,     6,     2,     0],
  // Ibuprofen:     NSAID -- GI issues prominent
  /* Ibuprofen    */ [40,   18,    12,   8,     15,    70,    5,     3,     0,     10,    2,     0],
  // Amoxicillin:   Antibiotic -- GI and allergic reactions
  /* Amoxicillin  */ [22,   8,     40,   35,    10,    15,    3,     2,     0,     8,     5,     0],
  // Ciprofloxacin: Fluoroquinolone -- GI, CNS side effects, tendon issues
  /* Ciprofloxacin*/ [50,   25,    45,   12,    20,    18,    8,     22,    0,     15,    5,     10],
  // Metformin:     Diabetes drug -- strong GI side effects
  /* Metformin    */ [65,   12,    60,   3,     8,     25,    5,     4,     0,     18,    15,    0],
  // Omeprazole:    PPI -- mild side effects, headache notable
  /* Omeprazole   */ [12,   10,    8,    3,     30,    5,     6,     4,     0,     10,    8,     0],
  // Captopril:     ACE inhibitor -- dry cough is hallmark
  /* Captopril    */ [15,   40,    5,    10,    22,    8,     4,     6,     72,    12,    10,    3],
  // Diclofenac:    NSAID -- strong GI effects
  /* Diclofenac   */ [28,   20,    10,   6,     18,    68,    4,     3,     0,     14,    3,     0],
  // Cetirizine:    Antihistamine -- drowsiness is primary
  /* Cetirizine   */ [5,    8,     2,    3,     12,    2,     85,    0,     0,     18,    55,    0],
  // Dexamethasone: Corticosteroid -- metabolic/CNS effects
  /* Dexamethasone*/ [18,   12,    5,    4,     15,    22,    3,     55,    0,     45,    8,     10],
  // Ranitidine:    H2 blocker -- generally mild
  /* Ranitidine   */ [8,    12,    5,    4,     25,    5,     20,    6,     0,     10,    8,     2],
];

const severities = buildSeverities(matrix);

export const heatmapData: HeatmapData = {
  drugs,
  sideEffects,
  matrix,
  severities,
};

// Helper: convert matrix to flat cell array (useful for some rendering approaches)
export function getHeatmapCells(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (let i = 0; i < drugs.length; i++) {
    for (let j = 0; j < sideEffects.length; j++) {
      cells.push({
        drugName: drugs[i],
        sideEffect: sideEffects[j],
        frequency: matrix[i][j],
        severity: severities[i][j],
      });
    }
  }
  return cells;
}
