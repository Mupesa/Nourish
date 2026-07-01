/**
 * Stage 4.0 (Premium Gate) end-to-end test against the emulator stack.
 *
 * Verifies, with real Firestore transactions + real emulator-minted ID tokens:
 *   - free recipe-view cap (20th allowed, 21st blocked, re-open free)
 *   - Meal Planner locked for free users (402)
 *   - admin premium grant endpoint (happy path + 403 for non-admins)
 *   - premium unlocks planner + makes recipe views unmetered
 *   - revoke flips everything back
 *
 * Run (after `npm run build`, emulators up, recipes seeded):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 \
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   GCLOUD_PROJECT=nourish-22776 \
 *   ADMIN_UIDS=e2e-admin \
 *   node lib/scripts/e2e-premium.js
 *
 * NOTE: the running emulator's functions process must have ADMIN_UIDS=e2e-admin
 * so the admin user is recognised.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";
import { FREE_RECIPE_VIEW_CAP } from "../domain/premium";

const projectId = process.env.GCLOUD_PROJECT || "nourish-22776";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const fnHost = process.env.FUNCTIONS_EMULATOR_HOST || "127.0.0.1:5001";
const BASE = `http://${fnHost}/${projectId}/us-central1/api/api/v1`;

const FREE_UID = "e2e-free";
const ADMIN_UID = "e2e-admin";

initializeApp({ projectId });
const db = getFirestore();
const adminAuth = getAuth();

let passed = 0;
function check(label: string, cond: boolean, extra?: unknown): void {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    console.error(`  FAIL  ${label}`, extra ?? "");
    throw new Error(`Assertion failed: ${label}`);
  }
}

/** Mint an emulator ID token for a uid via custom-token sign-in. */
async function idToken(uid: string): Promise<string> {
  const custom = await adminAuth.createCustomToken(uid);
  const res = await axios.post(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`,
    { token: custom, returnSecureToken: true },
  );
  return res.data.idToken as string;
}

interface Resp {
  status: number;
  data: any;
}
function api(token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const opts = { headers, validateStatus: () => true };
  return {
    get: (p: string): Promise<Resp> => axios.get(`${BASE}${p}`, opts),
    post: (p: string, body?: unknown): Promise<Resp> =>
      axios.post(`${BASE}${p}`, body ?? {}, opts),
  };
}

const ONBOARD = {
  goal: "lose_weight",
  activityLevel: "moderately_active",
  dietaryPreferences: [],
  metrics: {
    ageYears: 30,
    biologicalSex: "male",
    heightCm: 180,
    weightKg: 80,
  },
};

async function main(): Promise<void> {
  console.log(`Stage 4.0 premium-gate e2e → ${BASE}\n`);

  // --- Setup: fresh fixed-uid users -------------------------------------
  for (const uid of [FREE_UID, ADMIN_UID]) {
    await adminAuth.deleteUser(uid).catch(() => undefined);
    await adminAuth.createUser({ uid });
    await db
      .collection("users")
      .doc(uid)
      .collection("private")
      .doc("recipeAccess")
      .delete()
      .catch(() => undefined);
  }

  const freeTok = await idToken(FREE_UID);
  const adminTok = await idToken(ADMIN_UID);
  const free = api(freeTok);
  const admin = api(adminTok);

  // Onboard both so getProfile / requirePremium have a doc.
  check(
    "free user onboards",
    (await free.post("/profile/onboarding", ONBOARD)).status === 201,
  );
  check(
    "admin user onboards",
    (await admin.post("/profile/onboarding", ONBOARD)).status === 201,
  );

  // Pre-seed the free user to one below the cap (19 distinct unlocked).
  const dummy = Array.from({ length: FREE_RECIPE_VIEW_CAP - 1 }, (_, i) => `local:dummy-${i}`);
  await db
    .collection("users")
    .doc(FREE_UID)
    .collection("private")
    .doc("recipeAccess")
    .set({ viewedKeys: dummy, updatedAt: Date.now() });

  // --- Recipe view cap --------------------------------------------------
  const r20 = await free.get("/recipes/curated-001");
  check("20th recipe view allowed", r20.status === 200, r20.data);
  check("  freeViewsRemaining is 0", r20.data.freeViewsRemaining === 0, r20.data);
  check("  isPremium false", r20.data.isPremium === false, r20.data);

  const r21 = await free.get("/recipes/curated-002");
  check("21st distinct recipe blocked (402)", r21.status === 402, r21.data);
  check(
    "  402 code premium_required",
    r21.data?.error?.code === "premium_required" || r21.data?.code === "premium_required",
    r21.data,
  );

  const rReopen = await free.get("/recipes/curated-001");
  check("re-opening an unlocked recipe is free (200)", rReopen.status === 200, rReopen.data);
  check("  still freeViewsRemaining 0", rReopen.data.freeViewsRemaining === 0, rReopen.data);

  // --- Planner locked for free -----------------------------------------
  const plannerFree = await free.get("/planner/week?start=2026-06-22");
  check("free user planner blocked (402)", plannerFree.status === 402, plannerFree.data);

  // --- Admin grant ------------------------------------------------------
  const grant = await admin.post(`/admin/users/${FREE_UID}/premium`, {
    isPremium: true,
  });
  check("admin grants premium (200)", grant.status === 200, grant.data);
  check("  response echoes isPremium true", grant.data.isPremium === true, grant.data);

  // --- Premium unlocks --------------------------------------------------
  const plannerPrem = await free.get("/planner/week?start=2026-06-22");
  check("premium user planner allowed (200)", plannerPrem.status === 200, plannerPrem.data);

  const r21Prem = await free.get("/recipes/curated-002");
  check("premium recipe view unmetered (200)", r21Prem.status === 200, r21Prem.data);
  check("  isPremium true in response", r21Prem.data.isPremium === true, r21Prem.data);

  // --- Admin gate (non-admin blocked) ----------------------------------
  const nonAdmin = await free.post(`/admin/users/${ADMIN_UID}/premium`, {
    isPremium: true,
  });
  check("non-admin blocked from admin route (403)", nonAdmin.status === 403, nonAdmin.data);

  // --- Revoke -----------------------------------------------------------
  const revoke = await admin.post(`/admin/users/${FREE_UID}/premium`, {
    isPremium: false,
  });
  check("admin revokes premium (200)", revoke.status === 200, revoke.data);

  const plannerAfter = await free.get("/planner/week?start=2026-06-22");
  check("planner locked again after revoke (402)", plannerAfter.status === 402, plannerAfter.data);

  console.log(`\nAll ${passed} checks PASS ✅`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\nE2E FAILED:", err.message);
  process.exit(1);
});
