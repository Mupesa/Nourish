/**
 * Secret + environment access. In production these resolve from Firebase
 * Secret Manager (declared in index.ts and bound to the function). Locally they
 * resolve from the .env loaded by the Functions emulator.
 */
import { defineSecret } from "firebase-functions/params";

/** Spoonacular API key for nutrition lookups (FR-1 Quick Meals). */
export const spoonacularApiKey = defineSecret("SPOONACULAR_API_KEY");

/**
 * Read the key at request time. Prefers the bound secret, falls back to a plain
 * env var so local `.env`-based emulator runs work without Secret Manager.
 */
export function getSpoonacularKey(): string | null {
  const fromSecret = spoonacularApiKey.value();
  if (fromSecret) return fromSecret;
  return process.env.SPOONACULAR_API_KEY ?? null;
}
