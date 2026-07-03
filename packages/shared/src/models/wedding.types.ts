import { z } from "zod";

// Paired with the pgEnums in apps/server/src/db/schema/enums.schema.ts —
// keep the values aligned (DB schema + runtime validation).

export const WeddingStatusEnum = z.enum(["planning", "complete"]);
export type WeddingStatus = z.infer<typeof WeddingStatusEnum>;

/**
 * Where a checklist or budget item came from: "generated" by the planner,
 * "manual" from the couple, or "booking" (a budget line auto-populated from a
 * confirmed vendor booking).
 */
export const ContentSourceEnum = z.enum(["generated", "manual", "booking"]);
export type ContentSource = z.infer<typeof ContentSourceEnum>;

export const BookingStatusEnum = z.enum(["pending", "confirmed", "cancelled"]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;
