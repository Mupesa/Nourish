/**
 * Firebase Admin SDK bootstrap. Imported for its side effect (initializeApp)
 * by anything that needs Firestore or Auth. Safe to import many times — guarded
 * against double-initialization.
 */
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    // In Cloud Functions and the emulator, credentials are auto-discovered.
    credential: applicationDefault(),
  });
}

export const db = getFirestore();
export const auth = getAuth();

// Don't throw on documents that contain undefined fields; just drop them.
db.settings({ ignoreUndefinedProperties: true });
