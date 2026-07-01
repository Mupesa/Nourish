/**
 * Meal Planner routes. One DayPlan per date; a week view fetches 7. "Mark
 * cooked" auto-logs into the diary. All free in Phase 2 (premium deferred).
 */
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import {
  dateParamSchema,
  planItemSchema,
  weekQuerySchema,
} from "../domain/validation";
import {
  addPlanItem,
  getDayPlan,
  getWeekPlan,
  markPlanItemCooked,
  removePlanItem,
} from "../services/planner.service";

export const plannerRouter = Router();

const slotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

/** GET /planner/week?start=YYYY-MM-DD — 7 day plans. */
plannerRouter.get(
  "/week",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { start } = parse(weekQuerySchema, req.query);
    res.json({ days: await getWeekPlan(user.uid, start) });
  }),
);

/** GET /planner/:date — one day plan. */
plannerRouter.get(
  "/:date",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    res.json({ plan: await getDayPlan(user.uid, date) });
  }),
);

/** POST /planner/:date/items — add a recipe to a slot. */
plannerRouter.post(
  "/:date/items",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    const input = parse(planItemSchema, req.body);
    res.status(201).json({ plan: await addPlanItem(user.uid, date, input) });
  }),
);

/** DELETE /planner/:date/items/:slot/:itemId — remove a planned item. */
plannerRouter.delete(
  "/:date/items/:slot/:itemId",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    const slot = parse(slotSchema, req.params.slot);
    res.json({
      plan: await removePlanItem(user.uid, date, slot, req.params.itemId),
    });
  }),
);

/** POST /planner/:date/items/:slot/:itemId/cooked — mark cooked + auto-log. */
plannerRouter.post(
  "/:date/items/:slot/:itemId/cooked",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    const slot = parse(slotSchema, req.params.slot);
    res.json({
      plan: await markPlanItemCooked(user.uid, date, slot, req.params.itemId),
    });
  }),
);
