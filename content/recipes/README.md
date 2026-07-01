# Nourish recipe image pipeline

The JSON catalogue contains 100 recipes. Image production is checkpointed in
reviewed batches; only manifest entries with `qaStatus: "approved"` may be
uploaded or exposed by the seed script.

## Current checkpoint

- Recipes authored and validated: 100
- Approved master/WebP images: `curated-001` through `curated-100`
- Deferred image production: none
- Emulator integration: all `curated-001` through `curated-100` WebPs uploaded and reseeded with LAN image URLs for mobile testing
- Delivery format: 1200×800 WebP, approximately 150–400 KB
- Storage object: `recipes/{recipeId}/hero.webp`

## Batch workflow

1. Generate one distinct master per recipe into `content/recipes/masters`.
2. Run `python tools/prepare-recipe-images.py`.
3. Review `content/recipes/contact-sheet.jpg`.
4. Run:

   `python tools/validate-recipe-images.py --expected N --approve-through N`

5. Build backend scripts with `npm run build` from `backend/functions`.
6. Upload to the Storage emulator:

   `$env:STORAGE_EMULATOR_HOST="http://127.0.0.1:9199"; $env:GCLOUD_PROJECT="nourish-22776"; node lib/scripts/upload-recipe-images.js`

7. Seed the Firestore emulator. Use the computer's current LAN IP for `STORAGE_EMULATOR_HOST` when testing on a physical phone:

   `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8090"; $env:STORAGE_EMULATOR_HOST="192.168.8.147:9199"; $env:GCLOUD_PROJECT="nourish-22776"; node lib/scripts/seed-rest.js`

## Production release

Production remains opt-in. Authenticate with an authorized service account,
confirm the Firebase project and bucket, back up the existing collection, then
run the image upload before the Firestore seed:

- `node lib/scripts/upload-recipe-images.js --production`
- `node lib/scripts/seed.js --production`

Never run either production command until all intended images have passed the
contact-sheet review and automated validation report.
