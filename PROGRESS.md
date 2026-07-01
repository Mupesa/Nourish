# Nourish — Build Progress & Handoff

_Last updated: 2026-06-29_

A mobile-first "supportive kitchen friend": calorie tracking + meal planning + (later) social cooking streaks. This file is the durable source of truth for build status and how to run things. Memory files mirror key facts at `.claude/projects/.../memory/`.

## Stack & key decisions
- **Mobile:** Expo **SDK 54** (RN 0.81.5, React 19.1, TypeScript), Firebase **JS SDK v12**, React Navigation. Pinned to SDK 54 to match the user's Expo Go app.
- **Backend:** Firebase Cloud Functions **monolith** (Express + TypeScript), single HTTPS function `api`. Self-contained (own types); mobile mirrors types (no shared package, to avoid monorepo/deploy pain).
- **DB:** Firestore. **Auth:** Firebase Auth (Anonymous + Email/Password; deferred registration via anon→email linking). **Storage:** Firebase Storage (Phase 3).
- **Nutrition/recipes:** Spoonacular API (proxied through backend; key never on client).
- **Payments (Phase 4):** RevenueCat. **Ads (Phase 4):** AdMob.
- **Freemium:** recipe library + meal planner are "premium". **Gate ENFORCED as of Phase 4 Stage 4.0** — Meal Planner is premium-only; free users get up to **20 distinct recipe-detail views** then a paywall. Diary/tracking/social stay free.
- **Firebase project:** `nourish-22776` (project number 805682326779).

## Phase status
- ✅ **Phase 1 — Foundation (Auth + Profile + Calorie Engine):** DONE & confirmed working on device.
- ✅ **Phase 2 — Recipe Library + Meal Planner:** DONE (backend + mobile), verified (tsc, tests, bundle, e2e).
- ✅ **Phase 3 — Social (feed + friends + streaks):** Stages 3.0–3.4 + 3.6 DONE & emulator-verified (foundations, friend graph, posts/feed+camera+nav swap, likes+streaks, moderation, full composed journey). **3.5 (contacts matching) intentionally deferred by user.** Storage rules: auth recognition + enforcement confirmed on emulator; full owner/size/type rule verified by inspection + on-device SDK upload (raw-REST simple upload can't populate resource metadata). On-device manual walkthrough still recommended (camera→upload→post). mobile `tsc` green; backend 27 jest tests green.
- 🚧 **Phase 4 — Monetisation + Notifications + Analytics:** IN PROGRESS. ✅ **Stage 4.0 Premium Gate** DONE & emulator-verified (gate-only, no payment SDK yet). Remaining: RevenueCat purchase flow, FCM push (needs EAS dev build), analytics, AdMob.
- ✅ **Phase 5 — Personalised Recipe Recommendations:** DONE. Backend-first deterministic scorer uses onboarding/profile preferences (`goal`, `dietaryPreferences`, `targets`) to rank local recipes; Home and Discover now consume personalized recommendations.

## Phase 5 — Personalised Recipe Recommendations — shipped & verified

### Product goal
Make the recipe library feel selected for the user instead of generic. Onboarding already captures the key signals: nutrition goal, dietary preferences, activity level, metrics, and server-computed calorie/macro targets. Phase 5 will use those profile fields to rank recipes for Home, Discover, and later Planner suggestions.

### What shipped
- Backend pure scorer: `backend/functions/src/domain/recommendations.ts`.
- Backend types: `RecommendationReason`, `RecipeRecommendation`.
- Backend service: `backend/functions/src/services/recommendation.service.ts`.
- Backend endpoint: `GET /api/v1/recipes/recommended`.
- Mobile API client: `getRecommendedRecipes()` in `mobile/src/api/recipes.ts`.
- Home now calls recommendations and labels the rail `Recommended for you`.
- Discover now uses personalized recommendations for local browsing when no external text search is running.
- Recipe cards can show a compact one-line recommendation reason.

### Existing integration points
- Preferences are stored in `users/{uid}` by `completeOnboarding` in `backend/functions/src/services/profile.service.ts`.
- Current profile shape already includes `goal`, `activityLevel`, `dietaryPreferences`, `metrics`, and `targets`.
- Mobile reads profile through `ProfileContext`, but recommendation scoring should happen server-side by fetching `getProfile(user.uid)` from the authenticated request.
- Local recipes are stored in `recipes/{id}` and listed through `backend/functions/src/services/recipe.service.ts`.
- Current recipe routes are in `backend/functions/src/routes/recipes.routes.ts`; route order matters because `/:id` is a catch-all.
- Discover currently uses `GET /api/v1/recipes`; Home currently uses `GET /api/v1/recipes/featured`.

### API plan
- `GET /api/v1/recipes/recommended`
  - Auth required.
  - Must be declared before `/spoonacular/*`, `/community`, and especially `/:id`.
  - Query params: `page`, `limit`, optional `mealType`, optional `tag`, optional `cuisine`, optional `q`, optional `includeReasons`.
  - Response shape:
    ```json
    {
      "recipes": [
        {
          "recipe": { "...Recipe": "shape" },
          "score": 87,
          "reasons": [
            "Matches your Mediterranean preference",
            "Fits your daily calorie target",
            "Higher protein for your goal"
          ]
        }
      ],
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
    ```
- Keep `GET /api/v1/recipes` as the generic catalogue endpoint for non-personalized browsing and backward compatibility.
- Keep `GET /api/v1/recipes/featured` for backward compatibility; Home now calls `/recipes/recommended?limit=10`.
- No new profile endpoint is required for Phase 5 because the backend can fetch the authenticated profile directly.

### Scoring v1
Use a deterministic weighted score from roughly 0-100. Avoid ML for now; the catalogue is small and the logic should be explainable.

- Dietary preference match: up to +35.
  - Matching selected dietary tags gets a strong boost.
  - `vegan` and `vegetarian` should be treated as strong constraints or heavy demotions for non-matching recipes.
  - `gluten_free`, `keto`, `paleo`, and `mediterranean` should boost matching recipes unless we later add explicit allergy/strict restriction settings.
- Calorie fit: up to +25.
  - Compare recipe kcal to a meal target derived from `profile.targets.dailyGoalKcal`.
  - Suggested slot targets: breakfast 20-25%, lunch 25-30%, dinner 30-35%, snack 8-12%.
  - If no mealType is provided, score against a general meal band around 25-35%.
- Goal and macro fit: up to +25.
  - `lose_weight`: favor higher protein per kcal and moderate calories.
  - `gain_muscle`: favor higher protein and sufficient calories.
  - `maintain_tone`: favor balanced macro ratios near profile targets.
  - `healthy_habits`: favor balanced, lower-difficulty, practical recipes.
  - `keto`: add an extra low-carb boost.
- Practicality: up to +10.
  - Boost easier recipes and reasonable total time.
- Image/readiness boost: up to +5.
  - Temporarily boost recipes with `imageUrl` while only 30 recipe images are available, so first impressions are visual.
  - Remove or reduce this once images `031..100` are complete.
- Diversity adjustment:
  - After sorting, lightly re-rank the page to avoid too many same-cuisine or same-meal-type cards in a row.
  - Keep this deterministic so tests remain stable.

### Recommendation reasons
Return short, user-facing reason strings generated from the strongest scoring factors:
- `Matches your vegan preference`
- `Fits your Mediterranean preference`
- `Good fit for your weight-loss goal`
- `Higher protein for your muscle-gain goal`
- `Fits your daily calorie target`
- `Quick option for busy days`

The UI should show at most one reason per card in compact surfaces and more detail later on recipe detail.

### Follow-up mobile/product ideas
- Add a `Suggested for this week` rail in Planner.
- Add richer `Why this fits you` detail on the recipe detail screen.
- Decide whether onboarding dietary choices are preferences or strict restrictions; if strict/allergy-safe filtering is needed, add a separate `strictDietaryRestrictions` field.

### Conflict scan and decisions
- Route conflict: `/recipes/recommended` would be swallowed by `/:id` if placed too low. Register it before `/:id`.
- Premium gate: recommended list should not meter recipe views. Metering remains only on detail endpoints (`GET /recipes/:id`, `GET /recipes/spoonacular/:id`).
- Discover first page image issue: current generic list sorts newest-first, so image-backed `curated-001..030` appear later. Recommendation v1 can include a small image-readiness boost to improve first-run UX until remaining images are produced.
- Privacy: do not send raw metrics to the recommendation endpoint from the client. The backend reads the authenticated profile and uses computed targets.
- Strict dietary semantics: onboarding currently says "preferences", not allergies. For v1, use strong boosts/demotions rather than silently hiding everything except vegan/vegetarian if product copy still says preference. If allergy-safe filtering is needed, add a separate `strictDietaryRestrictions` field later.
- Performance: current recipe listing already loads all approved recipes and filters in memory. This is acceptable for 100 recipes. If catalogue grows significantly, add denormalized recommendation bands or Firestore query prefilters.
- Spoonacular: do not personalize external search in v1 beyond existing search. External details remain metered by premium gate.
- Community recipes: approved community recipes can be scored using the same fields. Poor/incomplete metadata will naturally score lower; validation already requires core fields.

### Verification checklist
- ✅ `npm test -- --runInBand` in `backend/functions`: 43 tests passed.
- ✅ `npm run lint` in `backend/functions`: TypeScript passed.
- ✅ `npm run build` in `backend/functions`: compiled Functions output refreshed.
- ✅ `npx tsc --noEmit` in `mobile`: TypeScript passed.
- Not run this pass: full emulator/on-device smoke. Recommended endpoint is list-only and does not call `enforceRecipeView`, so it does not decrement free recipe-detail views by design.

### Phase 4 — Stage 4.0 (Premium Gate) — what shipped & verified
Decisions: free tier = **20 distinct recipe-detail views** (hard cap), then paywall; Meal Planner = fully premium; premium toggled for testing via an **admin grant endpoint** (RevenueCat webhook will later set the same `isPremium` field).
Backend: `domain/premium.ts` (pure `decideRecipeView` + `FREE_RECIPE_VIEW_CAP=20`) + 7 unit tests; `services/premium.service.ts` (`enforceRecipeView` transactional metering on `users/{uid}/private/recipeAccess.viewedKeys[]`; `setUserPremium`); recipe-detail routes (`GET /recipes/:id`, `/recipes/spoonacular/:id`) now metered + return `{freeViewsRemaining, isPremium}`; `/api/v1/planner` mounted behind `requirePremium`; admin `POST /admin/users/:uid/premium {isPremium}` (requireAdmin); `setPremiumSchema`. `isPremium` already defaulted false at onboarding + returned by `GET /profile` (no change needed).
Mobile: `ProfileContext` exposes `isPremium` + `freeViewsRemaining` + `noteFreeViewsRemaining`; `components/PaywallCard.tsx` (stubbed "Upgrade" CTA → coming-soon alert); Planner tab shows paywall when free; RecipeDetail shows paywall on 402 + a "N free recipes left" line; Discover shows a free-views banner; Profile shows Premium badge / Upgrade button. `api/recipes` detail calls return `RecipeDetailResult`.
Verified: backend `tsc` + **34 jest tests** (27 prior + 7 premium) green; emulator e2e `scripts/e2e-premium.ts` = **18/18 PASS** (cap 20th allowed / 21st 402 / re-open free; planner 402 free; admin grant→planner+recipes unlock; non-admin 403; revoke→402 again). Mobile `tsc` green.
Run the e2e: build + emulators up (with `ADMIN_UIDS=e2e-admin`) + seed, then `FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=nourish-22776 ADMIN_UIDS=e2e-admin node lib/scripts/e2e-premium.js`.

## 100-recipe catalogue — checkpoint
- ✅ **Catalogue data:** all 100 recipe records authored in `backend/functions/src/data/recipes.catalog.json`; IDs `curated-001..100`, meal/cuisine distributions, dietary minimums, ingredients, steps, per-serving macro estimates, and nutrition disclaimers validated.
- ✅ **API/mobile foundations:** page-based browsing (`page`, `limit`, `total`, `totalPages`), combined meal/cuisine/tag/text filtering, Home meal tiles opening filtered Discover, load-more pagination, image-path metadata, and estimated-nutrition messaging.
- ✅ **Image checkpoint 1–100:** 100 distinct warm editorial masters plus 1200×800 WebP delivery copies. Human contact-sheet review passed; automated validation passed readability, dimensions, 150–400 KB target, and perceptual duplicate checks. Manifest entries `curated-001..100` are approved.
- ✅ **Emulator image integration:** 100 approved WebPs uploaded to the Storage emulator at `recipes/{recipeId}/hero.webp`; all 100 documents reseeded idempotently with phone-reachable LAN image URLs (`http://192.168.8.147:9199/...`). API verified 100 unique records across 2 pages, all 100 image URLs present, sample WebPs HTTP 200, Functions health OK, and mobile `tsc` green. Expo started on LAN port 8083 for device testing.
- ⏭️ **Next image step:** on-device visual smoke test in Expo, then guarded production upload only with explicit approval.
- Pipeline files: `tools/generate-recipe-catalog.mjs`, `tools/prepare-recipe-images.py`, `tools/validate-recipe-images.py`, `content/recipes/image-manifest.json`, `content/recipes/image-validation-report.json`, and `backend/functions/src/scripts/upload-recipe-images.ts`.
- Safe release sequence for production: confirm on-device images → run the guarded upload/seed with explicit production approval. Production remains blocked unless the upload script receives explicit `--production`.

## What's built

### Backend (`backend/functions/`)
- **Calorie engine** (`src/domain/calorie-engine.ts`): Mifflin-St Jeor BMR → ×activity → +goal adjustment (floor 1200); macro split + water goal. 15 unit tests pass.
- **Domain** (`src/domain/`): `types.ts`, `constants.ts`, `validation.ts` (zod). Enums: 4 goals, 4 activity levels, 6 dietary prefs, recipe/planner types.
- **HTTP** (`src/http/`): auth middleware (Firebase ID token, anon ok), premium middleware (unused), admin middleware (ADMIN_UIDS env allowlist), error envelope, zod parse helper.
- **Services** (`src/services/`): profile, diary (transactional totals), spoonacular (guess/search/detail), recipe, planner (mark-cooked auto-logs to diary).
- **Routes** (`src/routes/`): meta, profile, diary, nutrition, recipes, planner, admin. Mounted under `/api/v1`.
- **Seed:** `src/data/recipes.catalog.json` is the 100-record source of truth; `src/data/curated-recipes.ts` is its typed adapter. `src/scripts/seed.ts` seeds idempotently and only assigns emulator image URLs when a prepared WebP exists.

### Mobile (`mobile/`)
- **Config/theme:** `src/config/{env,firebase}.ts`, `src/theme/tokens.ts` (unified "Vibrant Hearth" — Plus Jakarta Sans + `#f5fbf2`).
- **Auth/state:** `src/auth/AuthContext.tsx`, `src/profile/ProfileContext.tsx`, `src/onboarding/OnboardingContext.tsx`.
- **API clients:** `src/api/{client,profile,diary,nutrition,recipes,planner}.ts`.
- **Components:** AppText, Button, TextField, ProgressPills, ChoiceCard, OnboardingLayout, CalorieRing (SVG), RecipeCard.
- **Onboarding screens:** Welcome, Goal, **BodyMetrics (added — needed for Mifflin-St Jeor)**, Activity, Dietary, SaveProgress.
- **Main screens:** Home (ring + featured + categories), Discover (search + tag filters + grid), Diary (dashboard + log meal modal), Planner (week + mark cooked), Profile, RecipeDetail (ingredients + steps + add-to-planner + start cooking), CookMode (keep-awake).
- **Nav:** 5-tab bottom bar (Home/Discover/Diary/Planner/Profile) + stack screens LogMeal, RecipeDetail, CookMode.

## Data model (Firestore)
- `users/{uid}` — profile, metrics, server-computed `targets`, isPremium, onboardingCompleted.
- `users/{uid}/diaryEntries/{YYYY-MM-DD}` — meals[], waterMl, totals.
- `users/{uid}/mealPlans/{YYYY-MM-DD}` — DayPlan{meals:{breakfast,lunch,dinner,snack:[PlanItem]}}.
- `recipes/{id}` — curated + community (community status=pending until admin approve). Macros are P/C/F only (no fiber yet).
- Rules: per-user lockdown; client reads own data, backend writes derived fields. Approved recipes world-readable.

## API endpoints (`/api/v1`)
- meta: GET `/meta/health`, `/meta/enums`
- profile: POST `/profile/onboarding`, GET `/profile`, PATCH `/profile`
- diary: GET `/diary/:date`, POST `/diary/:date/meals`, DELETE `/diary/:date/meals/:mealId`, PUT `/diary/:date/water`
- nutrition: GET `/nutrition/guess?title=`, `/nutrition/search?q=`
- recipes: GET `/recipes` (q,tag,limit), `/recipes/recommended`, `/recipes/featured`, `/recipes/spoonacular/search`, `/recipes/spoonacular/:id`, `/recipes/:id`; POST `/recipes/community`
- planner: GET `/planner/week?start=`, `/planner/:date`; POST `/planner/:date/items`; DELETE `/planner/:date/items/:slot/:itemId`; POST `/planner/:date/items/:slot/:itemId/cooked`
- admin: GET `/admin/recipes/pending`; POST `/admin/recipes/:id/{approve,reject}`

## Local dev run-book
Machine has Node 24, npm 11, firebase-tools 15, Java 25 (all installed via winget/npm this session). **LAN IP changes per session — always re-check (`Get-NetIPAddress -AddressFamily IPv4`) and update `mobile/.env` (both `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_EMULATOR_HOST`) before starting.** As of 2026-06-25 it was **192.168.100.8** (WiFi; ignore the 192.168.56.1 VirtualBox adapter). User's Apache/XAMPP holds port 8081, so Metro uses **8082**. Firestore emulator moved to **8090** (was 8088 — the user runs a separate Expo project that squats 8088; Firestore is Java and silently loses the port race, so the seed lands in the wrong server). The app never talks to Firestore directly (only Auth 9099 + Storage 9199 + Functions 5001), so the Firestore port is backend-only.

**Every PowerShell session needs this PATH line first:**
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

**Terminal A — backend (repo root):**
```powershell
firebase emulators:start --only functions,firestore,auth,storage
```
(Phase 3 needs the **storage** emulator on 9199 for meal-photo uploads. Earlier phases used `functions,firestore,auth` only.)
Then seed recipes (once per emulator start), from `backend/functions/`:
```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8090"; $env:GCLOUD_PROJECT="nourish-22776"; node lib/scripts/seed-rest.js
```
**Use `seed-rest.js`, not `seed.js`.** The admin-SDK `seed.js` hangs on this machine/network (firebase-admin's gRPC/credential path blocks on a metadata-server lookup under Node ≥24). `seed-rest.js` writes via the Firestore emulator REST API (`Authorization: Bearer owner`) and is reliable. Verify with: `curl -s -H "Authorization: Bearer owner" "http://127.0.0.1:8090/v1/projects/nourish-22776/databases/(default)/documents/recipes/curated-001"` — should return Firestore JSON, not an HTML page (HTML ⇒ wrong server squatting the port).

**Terminal B — app (`mobile/`):**
```powershell
$env:EXPO_OFFLINE="1"; npx expo start --lan --port 8082 --clear
```
Connect Expo Go (same WiFi) to `exp://192.168.8.147:8082`.

**Firewall:** double-click `Desktop\Nourish-Fix-Network.bat` (self-elevating) to open ports 8081-8085, 5001, 9099. Needed because the network is Public/DomainAuthenticated.

## Gotchas learned (don't re-debug these)
- **Emulators MUST bind 0.0.0.0** (set in `firebase.json` emulators host) or the phone gets `auth/network-request-failed`.
- **Client Auth points at the emulator in dev** (`EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true`, host=LAN IP) so tokens match the Functions emulator. Set false for prod.
- **Expo Go SDK must match project SDK** (54). Mismatch → `UNIQUE constraint failed: updates.scope_key` on device.
- **Restart Metro with `--clear` after installing a native dep** (e.g. react-native-svg) or you get stale "Unable to resolve" errors.
- **`EXPO_OFFLINE=1`** avoids an Expo startup `fetch failed` in restricted networks.
- Firebase v12 `getReactNativePersistence` is RN-build-only — imported with a `@ts-ignore` in `src/config/firebase.ts` (works at runtime via Metro).
- PowerShell execution policy set to RemoteSigned (CurrentUser); `.cmd` shims bypass it.

## Config / secrets locations (gitignored)
- `backend/functions/.env` — `SPOONACULAR_API_KEY` (+ optional `ADMIN_UIDS`).
- `mobile/.env` — Firebase web config (apiKey, appId, etc.), `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_FIREBASE_EMULATOR`, `EXPO_PUBLIC_EMULATOR_HOST`.

## Before production (not done yet)
- Enable **Anonymous** sign-in in the real Firebase Auth console (app calls signInAnonymously on launch). Email/Password already enabled.
- Upgrade Firebase to **Blaze** plan to deploy functions.
- Set prod Spoonacular secret: `firebase functions:secrets:set SPOONACULAR_API_KEY`.
- Set `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false` and point API base at deployed function.

## Open TODOs / nice-to-haves
- Finish on-device visual smoke test for the 100 approved recipe images in Expo, then decide whether to do the guarded production upload.
- "Add to planner" always targets today; could let user pick a date.
- Recipe `Fiber` macro shown in mockup but not in model (add `fiberG?` if wanted).

## Phase 3 — Social (plan + progress)
Prototypes read: `stitch_nutricook_recipe_tracker/{snap_share_camera,snap_preview_send,community_hub,friend_activity_detail}/code.html`.

### Decisions (locked with user, 2026-06-24)
- **Friend graph:** @handle search + requests (primary) **+** phone-contacts matching (secondary; needs an optional discoverable phone field — no phone-auth).
- **Photo→nutrition:** DEFER AI. Manual calorie tag entry for now.
- **Sharing:** persistent friends-only "Cooked Today" feed **+** personal cooking streaks. **CUT** ephemeral view-once/24h snaps; **CUT** paired streaks.
- **Interactions:** likes only. **DEFER** comments, DMs, nudges (Phase 4).
- **Nav:** Community **replaces** the Profile tab; Profile moves to the top-left header avatar (matches every prototype). Camera/post = FAB on Community.
- Consequences: no Storage TTL/lifecycle, **no Cloud Scheduler** (streaks computed lazily on read), no Blaze needed for dev (emulators only; Blaze only at deploy for prod Storage).

### Architecture
- All social data access stays behind the Express API (Admin SDK). Client touches only Auth + Storage directly.
- **Public/private split:** private metrics stay in `users/{uid}`; a new **`profiles/{uid}`** holds only safe public fields (handle, name, photo, bio, streak, counts).
- **Feed query (MVP):** `posts where authorUid in [friends+self] orderBy createdAt` (chunked). Fan-out is the later scale path. Like/streak counters maintained in API transactions (no Firestore triggers).
- **Streaks:** updated in `diary.addMeal`; broken-streak detected lazily on read (lastCookedDate not today/yesterday ⇒ shown as 0).

### Data model (new collections)
`profiles/{uid}`, `handles/{handleLower}`→{uid}, `phoneIndex/{sha256(E.164)}`→{uid} (opt-in), `users/{uid}/friends|incomingRequests|outgoingRequests/{otherUid}`, `users/{uid}/blocks/{uid}`, `posts/{postId}` + `posts/{postId}/likes/{uid}`, `reports/{reportId}`.

### Stages (each: tsc + jest + emulator e2e)
- ✅ **3.0 Foundations** — types, `profiles`/`handles`, social.service + routes (`/social/me|handle|profile|users/:uid`), Firestore+Storage rules, mobile storage config + upload util + social API client + types, expo deps pinned in package.json.
- ✅ **3.1 Friend graph** — backend `friends.service.ts` (search w/ relationship, sendRequest + reverse auto-accept, accept/decline/cancel, listFriends/Requests, unfriend, block/unblock, listBlocks, getRelationship); routes added to social.routes.ts; GET /users/:uid now returns `{profile, relationship}` and 404s for blocked_by. Mobile: `api/friends.ts`, FriendsScreen (handle setup + search + requests + friends, inline add/accept/cancel/unfriend, long-press block), reachable via a Friends button on Profile (temporary home until the 3.2 nav swap). Emulator e2e ✓ (search, request, mirrors, accept, reverse auto-accept, unfriend→counts 0, block hides+404, self-request guard). Mobile `tsc` green.
- ✅ **3.2 Posts & feed + camera + nav swap** — backend `feed.service.ts` (createPost+postCount, deletePost author-only + best-effort Storage cleanup, listFeed friends+self chunked `in` w/ before cursor, listUserPosts), `feed.routes.ts` `/api/v1/feed`, composite index posts(authorUid,createdAt). Mobile: `api/feed.ts`, components `Avatar`+`PostCard`, screens `CommunityScreen` (feed + friends rail + header avatar→Profile + group icon→Friends + add-a-photo FAB), `CreatePostScreen` (expo-image-picker camera/library → manual kcal + caption → uploadMealImage → post), `UserProfileScreen` (profile + relationship action + block + posts grid), reworked `ProfileScreen` (now a stack screen: back btn, identity, my posts grid, Share-a-meal). **Nav swap:** Community replaced the Profile tab; Profile/CreatePost(modal)/UserProfile are stack screens; Profile reached via Community header avatar. Emulator e2e ✓ (feed friends-only + newest-first + stranger excluded, postCount, author-only delete 403, profile grid). Backend tsc+jest ✓, mobile tsc ✓.
- ✅ **3.3 Likes + streaks** — backend: `domain/streak.ts` (applyCook forward-only, liveCurrent, previousDay) + 12 unit tests; `FeedPost` type (Post + likedByMe); feed.service `likePost`/`unlikePost` (transactional likeCount, idempotent) + `annotateLikes` on listFeed/listUserPosts; like routes POST/DELETE `/feed/posts/:id/like`; `social.service.recordCookDay` (upserts profile streak) hooked into `diary.addMeal` (so logging a meal — incl. planner mark-cooked — advances the streak). Mobile: `utils/streak.ts` (liveStreak), `api/feed` like/unlike + FeedPost, interactive heart in PostCard with optimistic toggle in Community, streak chip on Community + streak line on Profile + live Day-streak stat on UserProfile. Emulator e2e ✓ (like/unlike idempotent + likedByMe in feed; streak increment/no-op/backfill-ignore/gap-reset via real diary logs). Backend 27 jest tests ✓, mobile tsc ✓.
- ✅ **3.4 Moderation** — backend: `ALL_REPORT_REASONS`; feed.service `reportPost` (dedupe by `postId_reporter`, no self-report) + `adminDeletePost`; `moderation.service` (listReports w/ status filter, resolveReport → dismiss or remove-post-then-resolve); routes POST `/feed/posts/:id/report`, admin GET `/admin/reports?status=`, POST `/admin/reports/:id/resolve`; reports composite index. Block enforcement already covers feed/search/profile (block severs friendship). Mobile: `api/feed.reportPost`, PostCard more-menu on others' posts → Community action sheet (Report / Block author). Emulator e2e ✓ (report+dedupe, self-report 400, invalid reason 400, admin routes gated 403). Admin happy-path is compile+gate verified (needs ADMIN_UIDS-set emulator for full run). Backend 27 tests ✓, mobile tsc ✓.
- ⏸️ 3.5 Contacts matching (phone-hash opt-in + expo-contacts) — **DEFERRED by user** (not needed for now).
- ✅ **3.6 Composed journey e2e** — full two-account walkthrough on the emulator stack (functions+firestore+auth+storage): onboard → claim handle + bio → friend request/accept (mirrored) → create posts → feed order + friends-only visibility → like/unlike → streak via real diary logs → friend profile/grid/relationship → report (dedupe) → block cascade (severs friendship, hides feed/search/profile) → unblock. **21/21 checks PASS.** Storage emulator auth recognition + rule enforcement confirmed (authed upload 200 / unauth 403 with a temporary relaxed rule; storage.rules then reverted to the secure owner/<5MB/image-only version). Full owner+size+type rule verified by inspection + reasoning (raw simple-upload doesn't populate request.resource.size/contentType — the device SDK upload is the real exercise). Backend 27 tests ✓, mobile tsc ✓.

### Stage 3.0 — what shipped & verified
Backend: `domain/types.ts` (+Phase 3 types), `constants.ts` (HANDLE_REGEX, BIO/NAME/CAPTION max), `validation.ts` (handle/profile schemas), `services/social.service.ts`, `routes/social.routes.ts`, mounted `/api/v1/social`, `conflict()` 409 helper. Rules: `profiles`/`handles` readable by signed-in (backend-only writes); Storage opens `posts/{uid}/` to owner image uploads (<5MB, image/*).
Mobile: `config/firebase.ts` (Storage + emulator on 9199), `utils/upload.ts` (compress+upload), `api/social.ts` (paths use `/api/v1/...`), `types/domain.ts` (+PublicProfile/Friend/Post). package.json pinned expo-camera ~17.0.10, expo-contacts ~15.0.11, expo-image-manipulator ~14.0.8, expo-image-picker ~17.0.11.
Verified: backend `tsc` + 15 jest tests pass; live emulator smoke test of all 4 endpoints (create, claim+lowercasing, patch, 409 dup, 400 invalid, cross-user read) ✓. Mobile `tsc` clean except `expo-image-manipulator` (not yet downloaded).

### Resolved
Mobile expo deps installed (`npm install` succeeded once the registry recovered); mobile `tsc` is fully green.
