/**
 * Daily diary routes. Date is always a YYYY-MM-DD string representing the
 * user's LOCAL day — the client computes it and passes it in, so timezones
 * never get muddled server-side.
 */
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import {
  dateParamSchema,
  logMealSchema,
  waterSchema,
} from "../domain/validation";
import {
  addMeal,
  deleteMeal,
  getDaySummary,
  setWater,
} from "../services/diary.service";

export const diaryRouter = Router();

/** GET /diary/:date — day summary (entry + remaining budget + targets). */
diaryRouter.get(
  "/:date",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    res.json(await getDaySummary(user.uid, date));
  }),
);

/** POST /diary/:date/meals — log a meal. */
diaryRouter.post(
  "/:date/meals",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    const input = parse(logMealSchema, req.body);
    res.status(201).json(await addMeal(user.uid, date, input));
  }),
);

/** DELETE /diary/:date/meals/:mealId — remove a logged meal. */
diaryRouter.delete(
  "/:date/meals/:mealId",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    res.json(await deleteMeal(user.uid, date, req.params.mealId));
  }),
);

/** PUT /diary/:date/water — set or adjust water intake. */
diaryRouter.put(
  "/:date/water",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const date = parse(dateParamSchema, req.params.date);
    const input = parse(waterSchema, req.body);
    res.json(await setWater(user.uid, date, input));
  }),
);
