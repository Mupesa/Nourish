/**
 * Environment configuration. Values come from EXPO_PUBLIC_* variables which
 * Expo inlines at build time (see .env / .env.example). Centralised here so the
 * rest of the app never reads process.env directly.
 */

function required(value: string | undefined, name: string): string {
  if (!value || value.length === 0) {
    // Surfaced loudly in dev; in production these must be set at build time.
    console.warn(`[env] Missing required env var: ${name}`);
    return "";
  }
  return value;
}

export const env = {
  firebase: {
    apiKey: required(
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      "EXPO_PUBLIC_FIREBASE_API_KEY",
    ),
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      "nourish-22776.firebaseapp.com",
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "nourish-22776",
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      "nourish-22776.firebasestorage.app",
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "805682326779",
    appId: required(
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      "EXPO_PUBLIC_FIREBASE_APP_ID",
    ),
  },
  /**
   * Base URL of the Nourish API. In dev this points at the Functions emulator;
   * for a physical device on Expo Go, use your machine's LAN IP, not localhost.
   * Example emulator URL:
   *   http://192.168.1.10:5001/nourish-22776/us-central1/api
   */
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:5001/nourish-22776/us-central1/api",

  /**
   * When true, the client points Firebase Auth at the local emulator so its
   * tokens match what the Functions emulator verifies. Turn OFF for production
   * (real Firebase Auth + deployed functions).
   */
  useFirebaseEmulator:
    (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR ?? "false") === "true",
  /** Host (LAN IP for physical devices) where the emulators run. */
  emulatorHost: process.env.EXPO_PUBLIC_EMULATOR_HOST ?? "127.0.0.1",
};
