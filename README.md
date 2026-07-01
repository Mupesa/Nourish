# Nourish

A mobile-first "supportive kitchen friend" — calorie tracking, meal planning,
and recipe discovery with a social layer (streaks, community feed). Full
product spec: [`stitch_nutricook_recipe_tracker/nourish_developer_handover_doc.md`](stitch_nutricook_recipe_tracker/nourish_developer_handover_doc.md).

## Repo layout

```
mobile/            Expo / React Native app
backend/functions/ Firebase Cloud Functions (Express API monolith)
content/recipes/   Curated recipe WebP images + upload manifest
firestore.rules, storage.rules, firebase.json   Firebase project config
```

Firebase project: `nourish-22776` (see `.firebaserc`).

## Prerequisites

- Node.js 20 LTS
- Firebase CLI: `npm install -g firebase-tools`
- Expo Go app (physical device) or an iOS/Android simulator
- A Spoonacular API key: https://spoonacular.com/food-api

## First-time setup

```bash
git clone https://github.com/Mupesa/Nourish.git
cd Nourish
npm install                # installs root orchestration helpers
npm run install:all        # installs backend/functions and mobile deps
firebase login
```

Copy the env templates and fill in the required values:

```bash
cp backend/functions/.env.example backend/functions/.env   # paste Spoonacular key
cp mobile/.env.example mobile/.env                         # paste Firebase web API key + app id
```

Both `.env.example` files are self-documenting (LAN IP notes for testing on a
physical phone, which values are already correct for `nourish-22776`, etc.).
Read them before asking "what do I put here."

## Daily dev loop

```bash
npm run dev
```

This starts everything at once: the Functions, Firestore, Auth, and Storage
emulators, plus the Expo dev server. Emulator UI is at
`http://127.0.0.1:4000`. Open the app via Expo Go (scan the QR code) or a
simulator.

Running the two halves separately (e.g. for clearer logs) still works:

```bash
npm --prefix backend/functions run serve   # all 4 emulators
npm --prefix mobile start                  # Expo
```

## Seed data

With the emulators running (`npm run dev` or `npm --prefix backend/functions run serve`),
in another terminal:

```bash
npm run seed            # loads the curated recipe library into emulator Firestore
npm run images:upload   # uploads the recipe WebP images into emulator Storage
```

Both scripts refuse to touch production unless you pass `--production`
explicitly (see the header comments in
`backend/functions/src/scripts/seed.ts` and `upload-recipe-images.ts`).

## Tests & type-checking

```bash
cd backend/functions && npm test          # jest — calorie engine, etc.
cd backend/functions && npm run lint       # tsc --noEmit
cd mobile && npx tsc --noEmit
```

## Deploying

These steps touch a real, live Firebase project and (for the seed step) real
user-facing data. Run them yourself, in order, from your own machine — don't
automate this blindly.

### 0. Prerequisites

- The `nourish-22776` Firebase project must be on the **Blaze (pay-as-you-go)
  plan** — Cloud Functions and outbound calls to Spoonacular don't work on
  the free Spark plan. Enable this in the Firebase console first if you
  haven't already.
- `firebase login` (once per machine).
- A **service account key** (Firebase console → Project settings → Service
  accounts → Generate new private key) for the seed/upload scripts below —
  they run locally against production, so unlike the deployed Function itself
  they can't auto-discover credentials. Save it somewhere outside the repo and
  set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json` when running them.

### 1. Deploy the backend

```bash
# one-time: store the production secret
firebase functions:secrets:set SPOONACULAR_API_KEY

firebase deploy --only functions,firestore:rules,storage:rules
```

Copy the URL the deploy output prints for the `api` function — you'll need it
in step 3. Don't guess the hostname format.

### 2. Upload recipe images and seed Firestore

Both scripts refuse to touch production unless you pass `--production`
explicitly, and both need the service account key from step 0:

```bash
cd backend/functions
npm run build

GCLOUD_PROJECT=nourish-22776 GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node lib/scripts/upload-recipe-images.js --production

# Only when you actually mean to write into production Firestore:
GCLOUD_PROJECT=nourish-22776 GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node lib/scripts/seed.js --production
```

### 3. Point mobile at production

Copy `mobile/.env.production.example` values into `mobile/.env`, pasting the
function URL from step 1 into `EXPO_PUBLIC_API_BASE_URL`. Then restart with
`expo start -c` (the `-c` clears the bundler cache so the new inlined env
values actually take effect).

This only covers testing a locally-run Expo app against production — there's
no EAS Build / app store submission pipeline set up yet. That's separate,
later work.
