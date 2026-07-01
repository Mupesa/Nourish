/**
 * Cloud Functions entry point. Exports the entire Nourish API as a single
 * HTTPS function ("api") — the monolith deployment the project chose. Add new
 * background/scheduled functions (e.g. Phase 3 streak resets) as additional
 * named exports here.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import "./config/firebase"; // side-effect: init admin SDK
import { createApp } from "./app";
import { spoonacularApiKey } from "./config/secrets";

// Shared runtime defaults for all v2 functions.
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const app = createApp();

export const api = onRequest(
  {
    // Bind the Spoonacular secret so getSpoonacularKey() can read it.
    secrets: [spoonacularApiKey],
    cors: true,
  },
  app,
);
