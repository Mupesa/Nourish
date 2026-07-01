/**
 * Dev helper: grant/revoke premium for a uid directly (no admin auth), for
 * testing the freemium gate on a device against the emulator. Production uses
 * the admin endpoint / RevenueCat webhook instead.
 *
 *   npm run build
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 GCLOUD_PROJECT=nourish-22776 \
 *     node lib/scripts/grant-premium.js <uid> [true|false]
 *
 * Find your device uid in the Auth emulator UI (http://127.0.0.1:4000/auth)
 * after signing in on the phone.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "nourish-22776";

initializeApp({ projectId });
const db = getFirestore();

async function main(): Promise<void> {
  const uid = process.argv[2];
  const isPremium = process.argv[3] !== "false"; // default true
  if (!uid) {
    console.error("Usage: node lib/scripts/grant-premium.js <uid> [true|false]");
    process.exit(1);
  }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn(
      "WARNING: FIRESTORE_EMULATOR_HOST not set — this would write to PRODUCTION.",
    );
  }

  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`No profile for uid ${uid} (complete onboarding first).`);
    process.exit(1);
  }
  await ref.set({ isPremium, updatedAt: Date.now() }, { merge: true });
  console.log(`Set isPremium=${isPremium} for ${uid}.`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
