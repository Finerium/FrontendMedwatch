import { drugs } from "@/data/drugs";
import type { Drug } from "@/data/drugs";
import { interactionNetwork } from "@/data/interactions";
import type { DrugEdge } from "@/data/interactions";

export type SafetyResult = {
  drugName: string;
  severity: "safe" | "caution" | "warning" | "danger";
  sideEffects: { name: string; severity: string; frequencyPercent: number }[];
  interactions: { withDrug: string; severity: string; description: string }[];
  recallStatus: "active" | "recalled" | "none";
  recommendation: string;
};

function findDrugByName(name: string): Drug | undefined {
  return drugs.find(
    (d) => d.name.toLowerCase() === name.toLowerCase() || d.genericName.toLowerCase() === name.toLowerCase()
  );
}

function findInteractionsBetween(drugIds: string[]): DrugEdge[] {
  if (drugIds.length < 2) return [];
  const idSet = new Set(drugIds);
  return interactionNetwork.edges.filter(
    (edge) => idSet.has(edge.source) && idSet.has(edge.target)
  );
}

export function checkDrugSafety(drugNames: string[]): SafetyResult[] {
  const resolvedDrugs = drugNames.map((name) => ({
    name,
    drug: findDrugByName(name),
  }));

  const drugIds = resolvedDrugs
    .filter((r) => r.drug)
    .map((r) => r.drug!.id);

  const allInteractions = findInteractionsBetween(drugIds);

  return resolvedDrugs.map(({ name, drug }) => {
    if (!drug) {
      return {
        drugName: name,
        severity: "safe" as const,
        sideEffects: [],
        interactions: [],
        recallStatus: "none" as const,
        recommendation: "Obat tidak ditemukan dalam database. Periksa nama obat.",
      };
    }

    const drugInteractions = allInteractions.filter(
      (edge) => edge.source === drug.id || edge.target === drug.id
    );

    const interactions = drugInteractions.map((edge) => {
      const otherDrugId = edge.source === drug.id ? edge.target : edge.source;
      const otherDrug = drugs.find((d) => d.id === otherDrugId);
      return {
        withDrug: otherDrug?.name ?? otherDrugId,
        severity: edge.severity,
        description: edge.description,
      };
    });

    const sideEffects = drug.sideEffects.map((se) => ({
      name: se.name,
      severity: se.severity,
      frequencyPercent: se.frequencyPercent,
    }));

    const hasMajorInteraction = interactions.some((i) => i.severity === "Major");
    const hasModerateInteraction = interactions.some((i) => i.severity === "Moderate");
    const hasSevereSideEffect = drug.sideEffects.some((se) => se.severity === "Severe");
    const isRecalled = drug.recallStatus === "recalled";
    const isWatch = drug.recallStatus === "watch";

    let severity: SafetyResult["severity"];
    let recommendation: string;
    let recallStatus: SafetyResult["recallStatus"];

    if (isRecalled) {
      recallStatus = "recalled";
    } else if (isWatch) {
      recallStatus = "active";
    } else {
      recallStatus = "none";
    }

    if (isRecalled || hasMajorInteraction) {
      severity = "danger";
      const reasons: string[] = [];
      if (isRecalled) reasons.push(`${drug.name} telah ditarik dari peredaran: ${drug.recallNote ?? ""}`);
      if (hasMajorInteraction) {
        const majorPairs = interactions.filter((i) => i.severity === "Major");
        reasons.push(`Interaksi berat dengan ${majorPairs.map((i) => i.withDrug).join(", ")}`);
      }
      recommendation = `JANGAN diberikan. ${reasons.join(". ")}`;
    } else if (hasModerateInteraction || isWatch) {
      severity = "warning";
      const reasons: string[] = [];
      if (isWatch) reasons.push(`${drug.name} dalam pengawasan: ${drug.recallNote ?? ""}`);
      if (hasModerateInteraction) {
        const modPairs = interactions.filter((i) => i.severity === "Moderate");
        reasons.push(`Interaksi sedang dengan ${modPairs.map((i) => i.withDrug).join(", ")}`);
      }
      recommendation = `Berikan dengan pengawasan ketat. ${reasons.join(". ")}`;
    } else if (hasSevereSideEffect) {
      severity = "caution";
      const severeEffects = drug.sideEffects
        .filter((se) => se.severity === "Severe")
        .map((se) => se.name);
      recommendation = `Boleh diberikan, perhatikan risiko: ${severeEffects.join(", ")}`;
    } else {
      severity = "safe";
      recommendation = "Aman untuk diberikan sesuai dosis standar";
    }

    return {
      drugName: drug.name,
      severity,
      sideEffects,
      interactions,
      recallStatus,
      recommendation,
    };
  });
}
