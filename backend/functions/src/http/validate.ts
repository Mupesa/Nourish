import { z } from "zod";
import { badRequest } from "./errors";

/**
 * Parse unknown input with a zod schema, converting validation failures into a
 * 400 ApiError carrying field-level details.
 */
export function parse<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest("Validation failed", result.error.flatten());
  }
  return result.data;
}
