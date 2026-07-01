/**
 * Admin routes for community recipe moderation. Gated by requireAdmin
 * (ADMIN_UIDS env allowlist).
 */
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { requireAdmin } from "../http/middleware/admin";
import { parse } from "../http/validate";
import {
  reportQuerySchema,
  resolveReportSchema,
  setPremiumSchema,
  uidParamSchema,
} from "../domain/validation";
import {
  listPendingRecipes,
  setRecipeStatus,
} from "../services/recipe.service";
import { listReports, resolveReport } from "../services/moderation.service";
import { setUserPremium } from "../services/premium.service";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

/** GET /admin/recipes/pending — recipes awaiting review. */
adminRouter.get(
  "/recipes/pending",
  asyncHandler(async (_req, res) => {
    res.json({ recipes: await listPendingRecipes() });
  }),
);

/** POST /admin/recipes/:id/approve */
adminRouter.post(
  "/recipes/:id/approve",
  asyncHandler(async (req, res) => {
    res.json({ recipe: await setRecipeStatus(req.params.id, "approved") });
  }),
);

/** POST /admin/recipes/:id/reject */
adminRouter.post(
  "/recipes/:id/reject",
  asyncHandler(async (req, res) => {
    res.json({ recipe: await setRecipeStatus(req.params.id, "rejected") });
  }),
);

/** GET /admin/reports?status=open — the moderation queue. */
adminRouter.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const { status } = parse(reportQuerySchema, req.query);
    res.json({ reports: await listReports(status) });
  }),
);

/** POST /admin/reports/:id/resolve { action } — dismiss or remove the post. */
adminRouter.post(
  "/reports/:id/resolve",
  asyncHandler(async (req, res) => {
    const id = parse(uidParamSchema, req.params.id);
    const input = parse(resolveReportSchema, req.body);
    await resolveReport(id, input);
    res.json({ ok: true });
  }),
);

/** POST /admin/users/:uid/premium { isPremium } — grant/revoke premium.
 * Manual/support tool now; the RevenueCat webhook will set the same field later. */
adminRouter.post(
  "/users/:uid/premium",
  asyncHandler(async (req, res) => {
    const uid = parse(uidParamSchema, req.params.uid);
    const { isPremium } = parse(setPremiumSchema, req.body);
    await setUserPremium(uid, isPremium);
    res.json({ ok: true, uid, isPremium });
  }),
);
