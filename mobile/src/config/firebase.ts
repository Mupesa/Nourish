/**
 * Firebase client bootstrap (Firebase JS SDK). Initializes the app and Auth
 * with AsyncStorage persistence so sessions — including the anonymous session
 * used for deferred registration — survive app restarts.
 */
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  // getReactNativePersistence ships only in Firebase's React Native build, which
  // Metro resolves at runtime; it's absent from the default web typings, so we
  // suppress the type error here only.
  // @ts-ignore - RN-only export not present in default firebase/auth typings
  getReactNativePersistence,
} from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { env } from "./env";

const app = getApps().length === 0 ? initializeApp(env.firebase) : getApp();

// initializeAuth must run exactly once. On Fast Refresh the module may re-run,
// so fall back to getAuth if it was already initialized.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

// In dev, route Auth to the emulator so its tokens match what the Functions
// emulator verifies. No-op in production builds.
if (env.useFirebaseEmulator) {
  connectAuthEmulator(auth, `http://${env.emulatorHost}:9099`, {
    disableWarnings: true,
  });
}

// Storage for meal-photo uploads (Phase 3). connectStorageEmulator throws if
// called twice (e.g. on Fast Refresh), so guard it.
const storage = getStorage(app);
if (env.useFirebaseEmulator) {
  try {
    connectStorageEmulator(storage, env.emulatorHost, 9199);
  } catch {
    // already connected on a previous module evaluation
  }
}

export { app, auth, storage };
