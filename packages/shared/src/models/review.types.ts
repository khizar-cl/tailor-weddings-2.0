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

/** Statuses an admin may move a review into when moderating. */
export const ReviewModerationStatusEnum = z.enum([
	"published",
	"rejected",
	"flagged",
]);
export type ReviewModerationStatus = z.infer<typeof ReviewModerationStatusEnum>;

/** A per-dimension breakdown (professionalism, communication, quality, …), 1–5. */
export const ReviewRatingsSchema = z.record(
	z.string(),
	z.number().int().min(1).max(5),
);
export type ReviewRatingsSchema = z.infer<typeof ReviewRatingsSchema>;

/**
 * A published review as shown on a vendor's listing. `authorName` is the
 * reviewer's display label — the couple's names for a client review, the peer
 * business's name for a peer review — so the card renders without the client
 * knowing the review's internal shape.
 */
export const ReviewSchema = z.object({
	uuid: z.string().uuid(),
	type: ReviewTypeEnum,
	authorName: z.string(),
	overallRating: z.number().int(),
	ratings: ReviewRatingsSchema.nullable(),
	body: z.string().nullable(),
	publishedAt: z.date().nullable(),
});
export type ReviewSchema = z.infer<typeof ReviewSchema>;

export const ReviewListSchema = z.object({
	items: z.array(ReviewSchema),
});
export type ReviewListSchema = z.infer<typeof ReviewListSchema>;

export const ListReviewsInputSchema = z.object({
	vendorBusinessUuid: z.string().uuid(),
	type: ReviewTypeEnum.optional(),
});
export type ListReviewsInputSchema = z.infer<typeof ListReviewsInputSchema>;

/**
 * A review a booking has earned the caller the right to leave — the anchor for
 * the verified-review system. Surfaced so the frontend can prompt the couple
 * (client) or a co-booked vendor (peer) after the wedding.
 */
export const PendingReviewRequestSchema = z.object({
	uuid: z.string().uuid(),
	type: ReviewTypeEnum,
	subjectVendorBusinessUuid: z.string().uuid(),
	subjectBusinessName: z.string(),
	weddingDate: z.date().nullable(),
	sentAt: z.date(),
});
export type PendingReviewRequestSchema = z.infer<
	typeof PendingReviewRequestSchema
>;

export const PendingReviewRequestListSchema = z.object({
	items: z.array(PendingReviewRequestSchema),
});
export type PendingReviewRequestListSchema = z.infer<
	typeof PendingReviewRequestListSchema
>;

/** Submitting against a review request (the caller must be its target). */
export const SubmitReviewInputSchema = z.object({
	reviewRequestUuid: z.string().uuid(),
	overallRating: z.number().int().min(1).max(5),
	ratings: ReviewRatingsSchema.optional(),
	body: z.string().trim().max(4000).optional(),
});
export type SubmitReviewInputSchema = z.infer<typeof SubmitReviewInputSchema>;

export const ModerateReviewInputSchema = z.object({
	reviewUuid: z.string().uuid(),
	status: ReviewModerationStatusEnum,
});
export type ModerateReviewInputSchema = z.infer<
	typeof ModerateReviewInputSchema
>;
