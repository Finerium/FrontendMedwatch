import { DrugCategory } from "./drugs";

export interface DrugNode {
  id: string;
  name: string;
  category: DrugCategory;
  connections: number;
}

export interface DrugEdge {
  source: string;
  target: string;
  severity: "Minor" | "Moderate" | "Major";
  description: string;
}

export interface InteractionNetwork {
  nodes: DrugNode[];
  edges: DrugEdge[];
}

export const interactionNetwork: InteractionNetwork = {
  nodes: [
    { id: "drug-001", name: "Paracetamol", category: "Analgesic", connections: 3 },
    { id: "drug-002", name: "Ibuprofen", category: "NSAID", connections: 6 },
    { id: "drug-003", name: "Amoxicillin", category: "Antibiotic", connections: 3 },
    { id: "drug-004", name: "Amlodipine", category: "Antihypertensive", connections: 4 },
    { id: "drug-005", name: "Cetirizine", category: "Antihistamine", connections: 2 },
    { id: "drug-006", name: "Omeprazole", category: "Gastrointestinal", connections: 5 },
    { id: "drug-007", name: "Metformin", category: "Antidiabetic", connections: 4 },
    { id: "drug-008", name: "Captopril", category: "Antihypertensive", connections: 5 },
    { id: "drug-009", name: "Dexamethasone", category: "Corticosteroid", connections: 7 },
    { id: "drug-010", name: "Salbutamol", category: "Bronchodilator", connections: 2 },
    { id: "drug-011", name: "Ciprofloxacin", category: "Antibiotic", connections: 5 },
    { id: "drug-013", name: "Losartan", category: "Antihypertensive", connections: 3 },
    { id: "drug-014", name: "Sertraline", category: "Antidepressant", connections: 5 },
    { id: "drug-015", name: "Diclofenac", category: "NSAID", connections: 6 },
    { id: "drug-018", name: "Simvastatin", category: "Antihypertensive", connections: 4 },
  ],
  edges: [
    { source: "drug-002", target: "drug-008", severity: "Major", description: "NSAID mengurangi efek antihipertensi ACE inhibitor" },
    { source: "drug-002", target: "drug-015", severity: "Major", description: "Kombinasi NSAID meningkatkan risiko perdarahan GI" },
    { source: "drug-002", target: "drug-007", severity: "Moderate", description: "Ibuprofen dapat mengurangi efek hipoglikemik metformin" },
    { source: "drug-002", target: "drug-009", severity: "Major", description: "Kombinasi NSAID + kortikosteroid: risiko ulkus GI tinggi" },
    { source: "drug-002", target: "drug-013", severity: "Moderate", description: "NSAID mengurangi efek antihipertensi ARB" },
    { source: "drug-009", target: "drug-007", severity: "Moderate", description: "Kortikosteroid meningkatkan glukosa darah, melawan metformin" },
    { source: "drug-009", target: "drug-008", severity: "Minor", description: "Kortikosteroid dapat mengurangi efek ACE inhibitor" },
    { source: "drug-009", target: "drug-015", severity: "Major", description: "Kombinasi kortikosteroid + NSAID: risiko ulkus GI sangat tinggi" },
    { source: "drug-009", target: "drug-014", severity: "Moderate", description: "Dexamethasone dapat menurunkan kadar sertraline dalam darah" },
    { source: "drug-009", target: "drug-004", severity: "Minor", description: "Dexamethasone dapat mengurangi efek amlodipine" },
    { source: "drug-006", target: "drug-011", severity: "Moderate", description: "Omeprazole mengurangi absorpsi ciprofloxacin" },
    { source: "drug-006", target: "drug-007", severity: "Minor", description: "Omeprazole dapat sedikit meningkatkan absorpsi metformin" },
    { source: "drug-006", target: "drug-018", severity: "Moderate", description: "Omeprazole meningkatkan kadar simvastatin dalam darah" },
    { source: "drug-011", target: "drug-014", severity: "Major", description: "Ciprofloxacin + Sertraline: risiko perpanjangan interval QT" },
    { source: "drug-011", target: "drug-001", severity: "Minor", description: "Ciprofloxacin dapat meningkatkan kadar paracetamol" },
    { source: "drug-011", target: "drug-009", severity: "Moderate", description: "Risiko tendinopati meningkat dengan kombinasi fluorokuinolon + kortikosteroid" },
    { source: "drug-014", target: "drug-002", severity: "Major", description: "SSRI + NSAID: risiko perdarahan meningkat signifikan" },
    { source: "drug-014", target: "drug-015", severity: "Major", description: "SSRI + NSAID: risiko perdarahan GI meningkat" },
    { source: "drug-008", target: "drug-013", severity: "Major", description: "Kombinasi ACE inhibitor + ARB: risiko hiperkalemia dan gagal ginjal" },
    { source: "drug-008", target: "drug-004", severity: "Minor", description: "Efek aditif antihipertensi, monitor tekanan darah" },
    { source: "drug-004", target: "drug-018", severity: "Moderate", description: "Amlodipine meningkatkan kadar simvastatin, risiko miopati" },
    { source: "drug-001", target: "drug-014", severity: "Minor", description: "Paracetamol aman dikombinasi, interaksi minimal" },
    { source: "drug-015", target: "drug-008", severity: "Major", description: "Diclofenac mengurangi efek antihipertensi dan merusak fungsi ginjal" },
    { source: "drug-015", target: "drug-013", severity: "Moderate", description: "NSAID mengurangi efek antihipertensi ARB" },
    { source: "drug-005", target: "drug-014", severity: "Minor", description: "Cetirizine + Sertraline: sedikit peningkatan efek sedasi" },
  ],
};
