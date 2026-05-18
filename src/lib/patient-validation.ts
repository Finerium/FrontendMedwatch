/**
 * Client-side validation for patient SOAP numeric medical fields (bug
 * B03 in the mission register). Ranges mirror the server-side checks in
 * `api/routes/patient_routes.py` so any value accepted by this module is
 * also accepted by the backend. All user-facing messages are in Bahasa
 * Indonesia per the project locale rules.
 *
 * Key exports: `ObjectiveNumericKey`, `NUMERIC_RANGES`,
 * `SYSTOLIC_RANGE`, `DIASTOLIC_RANGE`, `validateField`,
 * `validateObjective`.
 */

import type { PatientObjective } from "./patient-format";

/** Numeric SOAP fields handled by this validator. */
export type ObjectiveNumericKey =
  | "tekanan_darah"
  | "bb_kg"
  | "tb_cm"
  | "lila_cm"
  | "nadi"
  | "suhu_c"
  | "respirasi";

type Range = { min: number; max: number; label: string; step: number };

/**
 * Allowed ranges for every numeric SOAP field except tekanan_darah
 * (composite systolic/diastolic). Numbers are clinically conservative
 * adult+anak limits used by faskes 1 practice.
 */
export const NUMERIC_RANGES: Record<Exclude<ObjectiveNumericKey, "tekanan_darah">, Range> = {
  bb_kg: { min: 1, max: 300, label: "BB (kg)", step: 0.1 },
  tb_cm: { min: 30, max: 300, label: "TB (cm)", step: 0.1 },
  lila_cm: { min: 8, max: 60, label: "LILA (cm)", step: 0.1 },
  nadi: { min: 30, max: 220, label: "Nadi", step: 1 },
  suhu_c: { min: 30, max: 44, label: "Suhu (C)", step: 0.1 },
  respirasi: { min: 5, max: 80, label: "Respirasi", step: 1 },
};

/** Acceptable systolic blood pressure range (mmHg). */
export const SYSTOLIC_RANGE = { min: 60, max: 250 };
/** Acceptable diastolic blood pressure range (mmHg). */
export const DIASTOLIC_RANGE = { min: 30, max: 160 };

const TD_PATTERN = /^\s*(\d{1,3})\s*\/\s*(\d{1,3})\s*$/;
const NUMERIC_ONLY = /^-?\d+(?:[.,]\d+)?$/;

/**
 * Return an Indonesian error message for a single field value, or null if
 * the value is acceptable (including empty = "not provided").
 */
export function validateField(key: ObjectiveNumericKey, raw: string): string | null {
  const v = (raw || "").trim();
  if (!v) return null;
  if (key === "tekanan_darah") {
    const m = TD_PATTERN.exec(v);
    if (!m) {
      return "Tekanan darah harus dalam format sistolik/diastolik (mis. 120/80).";
    }
    const sys = Number(m[1]);
    const dia = Number(m[2]);
    if (sys < SYSTOLIC_RANGE.min || sys > SYSTOLIC_RANGE.max) {
      return `Tekanan darah sistolik harus antara ${SYSTOLIC_RANGE.min} dan ${SYSTOLIC_RANGE.max}.`;
    }
    if (dia < DIASTOLIC_RANGE.min || dia > DIASTOLIC_RANGE.max) {
      return `Tekanan darah diastolik harus antara ${DIASTOLIC_RANGE.min} dan ${DIASTOLIC_RANGE.max}.`;
    }
    return null;
  }
  if (!NUMERIC_ONLY.test(v)) {
    return `${NUMERIC_RANGES[key].label} harus berupa angka.`;
  }
  const n = Number(v.replace(",", "."));
  const { min, max, label } = NUMERIC_RANGES[key];
  if (Number.isNaN(n) || n < min || n > max) {
    return `${label} harus antara ${min} dan ${max}.`;
  }
  return null;
}

/**
 * Validate the full Objective block. Returns a record of per-field errors
 * (empty record when everything passes).
 */
export function validateObjective(
  o: PatientObjective | undefined,
): Partial<Record<ObjectiveNumericKey, string>> {
  const errors: Partial<Record<ObjectiveNumericKey, string>> = {};
  if (!o) return errors;
  const keys: ObjectiveNumericKey[] = [
    "tekanan_darah",
    "bb_kg",
    "tb_cm",
    "lila_cm",
    "nadi",
    "suhu_c",
    "respirasi",
  ];
  for (const k of keys) {
    const msg = validateField(k, (o[k] as string) || "");
    if (msg) errors[k] = msg;
  }
  return errors;
}
