import { z } from "zod";

// Paired with the pgEnums in apps/server/src/db/schema/enums.schema.ts —
// keep the values aligned (DB schema + runtime validation).

export const ReviewTypeEnum = z.enum(["peer", "client"]);
export type ReviewType = z.infer<typeof ReviewTypeEnum>;

export const ReviewStatusEnum = z.enum([
	"pending",
	"published",
	"rejected",
	"flagged",
]);
export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

export const ReviewRequestStatusEnum = z.enum(["sent", "completed", "expired"]);
export type ReviewRequestStatus = z.infer<typeof ReviewRequestStatusEnum>;

export const RecommendationStatusEnum = z.enum([
	"suggested",
	"accepted",
	"dismissed",
]);
export type RecommendationStatus = z.infer<typeof RecommendationStatusEnum>;
