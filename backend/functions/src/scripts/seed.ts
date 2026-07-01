/**
 * Seeds the curated recipe library into Firestore. Idempotent (uses fixed ids).
 *
 * Against the emulator:
 *   npm run build
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8090 GCLOUD_PROJECT=nourish-22776 node lib/scripts/seed.js
 *
 * Or from the repo root: npm run seed (uses the correct port automatically).
 *
 * Against production (requires GOOGLE_APPLICATION_CREDENTIALS service account):
 *   GCLOUD_PROJECT=nourish-22776 node lib/scripts/seed.js
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { curatedRecipes } from "../data/curated-recipes";

interface ImageManifestItem {
  recipeId: string;
  qaStatus: "pending" | "approved" | "rejected";
}

const production = process.argv.includes("--production");
const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "nourish-22776";

if (!production && !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    "Refusing to seed without FIRESTORE_EMULATOR_HOST. Pass --production explicitly for production.",
  );
}

initializeApp({ projectId });
const db = getFirestore();
const manifestPath = resolve(
  __dirname,
  "../../../../content/recipes/image-manifest.json",
);
const approvedImageIds = new Set(
  (
    JSON.parse(readFileSync(manifestPath, "utf8")) as ImageManifestItem[]
  )
    .filter((item) => item.qaStatus === "approved")
    .map((item) => item.recipeId),
);

async function main(): Promise<void> {
  const target = process.env.FIRESTORE_EMULATOR_HOST
    ? `emulator (${process.env.FIRESTORE_EMULATOR_HOST})`
    : "PRODUCTION";
  console.log(`Seeding ${curatedRecipes.length} recipes into ${target}...`);

  const batch = db.batch();
  for (const recipe of curatedRecipes) {
    const deliveryFile = resolve(
      __dirname,
      "../../../../content/recipes/webp",
      `${recipe.id}.webp`,
    );
    const imageReady =
      approvedImageIds.has(recipe.id) && existsSync(deliveryFile);
    const seededRecipe = process.env.STORAGE_EMULATOR_HOST && imageReady
      ? {
          ...recipe,
          imageUrl:
            `http://${process.env.STORAGE_EMULATOR_HOST}/v0/b/` +
            `${projectId}.firebasestorage.app/o/` +
            `${encodeURIComponent(recipe.imagePath ?? "")}?alt=media`,
        }
      : {
          ...recipe,
          imageUrl: imageReady ? recipe.imageUrl : null,
        };
    batch.set(db.collection("recipes").doc(recipe.id), seededRecipe);
  }
  await batch.commit();

  console.log(`Done. Seeded ${curatedRecipes.length} curated recipes.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
