/** Unit conversion helpers. Canonical storage is always metric (cm, kg). */

export const cmFromFeetInches = (feet: number, inches: number): number =>
  Math.round((feet * 12 + inches) * 2.54);

export const kgFromLb = (lb: number): number =>
  Math.round(lb * 0.45359237 * 10) / 10;

export const lbFromKg = (kg: number): number => Math.round(kg / 0.45359237);

export const feetInchesFromCm = (
  cm: number,
): { feet: number; inches: number } => {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
};

/** Parse a numeric text field, returning NaN for empties/garbage. */
export const num = (s: string): number => {
  const n = parseFloat(s.trim());
  return Number.isFinite(n) ? n : NaN;
};
