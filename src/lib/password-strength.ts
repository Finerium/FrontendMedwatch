/**
 * Client-side password strength evaluation that mirrors the server policy.
 *
 * The backend is authoritative: it enforces a minimum length, rejects
 * common/leaked passwords, rejects passwords with fewer than four distinct
 * characters, rejects five or more of the same character in a row, and
 * rejects passwords that contain the username. This module reproduces the
 * same checks in the browser so the register form can give immediate,
 * honest feedback and a 0-to-4 strength score, while the server remains the
 * final gate.
 *
 * Key exports: `MIN_PASSWORD_LENGTH`, `evaluatePassword`, and the
 * `PasswordEvaluation` type consumed by the strength meter.
 */

/** Minimum password length enforced by the backend. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Small inline list of obvious weak passwords used only to drive the meter.
 * The server keeps the authoritative leaked-password list; this set just
 * lets the UI flag the most common choices before the round trip.
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "111111",
  "000000",
  "iloveyou",
  "admin",
  "administrator",
  "welcome",
  "letmein",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
  "football",
  "abc123",
  "passwordpassword",
]);

/** One labelled requirement and whether the current password satisfies it. */
export type PasswordRequirement = {
  id: string;
  label: string;
  met: boolean;
};

/** Full evaluation result returned to the form and the strength meter. */
export type PasswordEvaluation = {
  /** Integer score from 0 (empty/unusable) to 4 (all checks satisfied). */
  score: number;
  /** True only when every hard requirement is met (safe to submit). */
  valid: boolean;
  /** Per-requirement breakdown for rendering the helper checklist. */
  requirements: PasswordRequirement[];
};

/** Whether the password runs the same character five or more times in a row. */
function hasFiveRepeats(password: string): boolean {
  let run = 1;
  for (let i = 1; i < password.length; i += 1) {
    if (password[i] === password[i - 1]) {
      run += 1;
      if (run >= 5) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

/**
 * Evaluate a password against the mirrored server policy.
 *
 * @param password - The candidate password as typed.
 * @param username - The username being registered, compared case-insensitively.
 * @returns A score, an overall validity flag, and the requirement breakdown.
 */
export function evaluatePassword(password: string, username: string): PasswordEvaluation {
  const lengthOk = password.length >= MIN_PASSWORD_LENGTH;
  const distinctOk = new Set(password).size >= 4;
  const repeatsOk = !hasFiveRepeats(password);
  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const digit = /[0-9]/.test(password);
  const symbol = /[^A-Za-z0-9]/.test(password);
  const classCount = [lower, upper, digit, symbol].filter(Boolean).length;
  const classesOk = classCount >= 3;
  const normalized = password.toLowerCase();
  const commonOk = !COMMON_PASSWORDS.has(normalized);
  const trimmedUser = username.trim().toLowerCase();
  const usernameOk = trimmedUser.length === 0 || !normalized.includes(trimmedUser);

  const requirements: PasswordRequirement[] = [
    { id: "length", label: `Minimal ${MIN_PASSWORD_LENGTH} karakter`, met: lengthOk },
    {
      id: "classes",
      label: "Mengandung minimal 3 dari: huruf kecil, huruf besar, angka, simbol",
      met: classesOk,
    },
    { id: "distinct", label: "Minimal 4 karakter berbeda", met: distinctOk },
    { id: "repeats", label: "Tidak ada 5 karakter sama berturut-turut", met: repeatsOk },
    { id: "common", label: "Bukan kata sandi yang umum atau mudah ditebak", met: commonOk },
    { id: "username", label: "Tidak memuat username", met: usernameOk },
  ];

  const valid = requirements.every((r) => r.met);

  // Score on a 0..4 scale. Length is the gate: nothing scores while too short.
  // From there each satisfied dimension lifts the score, capped at 4.
  let score = 0;
  if (password.length > 0 && lengthOk) {
    score = 1;
    if (classCount >= 2) score += 1;
    if (classesOk && distinctOk) score += 1;
    if (valid) score += 1;
  } else if (password.length > 0) {
    score = 0;
  }

  return { score, valid, requirements };
}
