/**
 * Upload compressed recipe WebP files to Firebase Storage.
 *
 * Emulator (default/safe):
 *   STORAGE_EMULATOR_HOST=127.0.0.1:9199 GCLOUD_PROJECT=nourish-22776 \
 *     node lib/scripts/upload-recipe-images.js
 *
 * Production (explicit opt-in):
 *   GCLOUD_PROJECT=nourish-22776 GOOGLE_APPLICATION_CREDENTIALS=... \
 *     node lib/scripts/upload-recipe-images.js --production
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

interface ImageManifestItem {
  recipeId: string;
  deliveryFile: string;
  storagePath: string;
  qaStatus: "pending" | "approved" | "rejected";
}

const production = process.argv.includes("--production");
const projectId =
  process.env.GCLOUD_PROJECT ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  "nourish-22776";

if (!production && !process.env.STORAGE_EMULATOR_HOST) {
  throw new Error(
    "Refusing to upload without STORAGE_EMULATOR_HOST. Pass --production explicitly for production.",
  );
}

initializeApp({
  projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
});

const manifestPath = resolve(
  __dirname,
  "../../../../content/recipes/image-manifest.json",
);
const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8"),
) as ImageManifestItem[];
const bucket = getStorage().bucket();

async function main(): Promise<void> {
  let uploaded = 0;
  let skipped = 0;

  for (const item of manifest) {
    const localPath = resolve(__dirname, "../../../../", item.deliveryFile);
    if (item.qaStatus !== "approved" || !existsSync(localPath)) {
      skipped += 1;
      continue;
    }
    await bucket.upload(localPath, {
      destination: item.storagePath,
      metadata: {
        contentType: "image/webp",
        cacheControl: "public,max-age=31536000,immutable",
      },
    });
    uploaded += 1;
    console.log(`Uploaded ${item.recipeId} -> ${item.storagePath}`);
  }

  console.log(
    `Recipe image upload complete: ${uploaded} uploaded, ${skipped} missing/skipped (${production ? "production" : "emulator"}).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
