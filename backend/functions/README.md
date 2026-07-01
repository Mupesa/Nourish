# Nourish Backend (Firebase Cloud Functions)

The Nourish API as a single Express monolith deployed to one HTTPS Cloud
Function (`api`). Phase 1 scope: **Auth, User Profile, Calorie Engine, Daily
Diary, Nutrition lookup.**

## Architecture

```
src/
  index.ts              Cloud Function entry (exports `api`)
  app.ts                Express app assembly, route mounting
  config/
    firebase.ts         Admin SDK init (Firestore + Auth handles)
    secrets.ts          Spoonacular key (Secret Manager / .env)
  domain/               Pure business logic — no I/O, fully unit-tested
    types.ts            Canonical entity & enum types
    constants.ts        Nutrition tuning constants (multipliers, splits)
    calorie-engine.ts   Mifflin-St Jeor pipeline
    validation.ts       Zod request schemas (the trust boundary)
    __tests__/          Calorie engine unit tests
  http/
    errors.ts           Typed ApiError hierarchy
    async-handler.ts    Async route wrapper
    validate.ts         Zod-parse helper -> 400 on failure
    middleware/
      auth.ts           Firebase ID-token verification (anon supported)
      premium.ts        Freemium gating (ready for Phase 2)
      error-handler.ts  JSON error envelope + 404 fallback
  services/
    profile.service.ts  users/{uid} CRUD + target recompute
    diary.service.ts    diaryEntries/{date} transactional CRUD
    spoonacular.service.ts  Nutrition lookups
  routes/
    meta.routes.ts      /health, /enums (public)
    profile.routes.ts   onboarding + profile
    diary.routes.ts     daily diary
    nutrition.routes.ts quick-meal lookups
```

## Prerequisites

This machine currently has **no Node.js / Firebase CLI**. Install first:

1. **Node.js 20 LTS** — https://nodejs.org (or `winget install OpenJS.NodeJS.LTS`)
2. **Firebase CLI** — `npm install -g firebase-tools`
3. A **Firebase project** (Blaze plan required for Cloud Functions + outbound
   calls to Spoonacular). `/.firebaserc` already points at `nourish-22776` —
   only change this if you're pointing at a different project.
4. A **Spoonacular API key** — https://spoonacular.com/food-api

## Setup

```bash
cd backend/functions
npm install

# Local secret for the emulator:
cp .env.example .env          # then paste your Spoonacular key

# Run unit tests (calorie engine):
npm test

# Type-check:
npm run lint
```

## Run locally (emulators)

```bash
# from repo root, after `firebase login`
firebase emulators:start --only functions,firestore,auth,storage
# or: npm run serve   (same command, includes storage)
```

From the repo root, `npm run dev` starts all four emulators *and* Expo
together — see the root [README](../../README.md).

The API is then at:
`http://127.0.0.1:5001/<project-id>/us-central1/api/api/v1/...`

## Deploy

```bash
# one-time: store the production secret
firebase functions:secrets:set SPOONACULAR_API_KEY

firebase deploy --only functions,firestore:rules,storage:rules
```

`storage:rules` is easy to forget (same shape of mistake as the emulator flags
above) — without it, the Storage security rules governing client access to
recipe images never reach production, even though the Admin-SDK upload
script bypasses them and will "work" regardless. See the root
[README](../../README.md#deploying) for the full deployment walkthrough.

## Auth model

Every `/profile`, `/diary`, `/nutrition` request needs a Firebase **ID token**:

```
Authorization: Bearer <firebase-id-token>
```

Anonymous users have valid uids, so the app works before sign-up (deferred
registration). When the user later links Google/Email to their anonymous
account, the uid is preserved and all their data carries over.

## API reference (`/api/v1`)

| Method | Path | Auth | Body / Query | Description |
|---|---|---|---|---|
| GET | `/meta/health` | – | – | Liveness check |
| GET | `/meta/enums` | – | – | Canonical goal/activity/diet lists |
| POST | `/profile/onboarding` | ✓ | `{goal, activityLevel, dietaryPreferences[], metrics}` | Create profile, compute targets |
| GET | `/profile` | ✓ | – | Profile + computed targets |
| PATCH | `/profile` | ✓ | any subset of personalization fields | Update + recompute |
| GET | `/diary/:date` | ✓ | – | Day summary (entry + remaining) |
| POST | `/diary/:date/meals` | ✓ | `{slot, name, kcal, macros, source, ...}` | Log a meal |
| DELETE | `/diary/:date/meals/:mealId` | ✓ | – | Remove a meal |
| PUT | `/diary/:date/water` | ✓ | `{setMl}` or `{addMl}` | Set/adjust water |
| GET | `/nutrition/guess?title=` | ✓ | – | Estimate kcal/macros for a name |
| GET | `/nutrition/search?q=&limit=` | ✓ | – | Recipe search w/ nutrition |

`:date` is `YYYY-MM-DD` in the user's **local** timezone (computed client-side).

### Example: onboarding

```bash
curl -X POST .../api/v1/profile/onboarding \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "goal": "lose_weight",
    "activityLevel": "moderately_active",
    "dietaryPreferences": ["mediterranean"],
    "metrics": { "ageYears": 30, "biologicalSex": "male", "heightCm": 180, "weightKg": 80 }
  }'
```

Returns the profile with `targets: { bmrKcal, tdeeKcal, dailyGoalKcal, macroTargets, waterGoalMl }`.

## Calorie engine

Mifflin-St Jeor BMR → ×activity multiplier (TDEE) → +goal adjustment (clamped
≥1200 kcal). Macro split and water goal derived per goal/weight. All constants
live in `domain/constants.ts`; all logic in `domain/calorie-engine.ts` and is
covered by `domain/__tests__/calorie-engine.test.ts`.
