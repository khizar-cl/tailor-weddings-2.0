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

/**
 * A vendor match surfaced on the couple dashboard — a read-only snapshot of a
 * suggested recommendation with the business fields the card renders.
 */
export const WeddingRecommendationSchema = z.object({
	uuid: z.string().uuid(),
	vendorBusinessUuid: z.string().uuid(),
	businessName: z.string(),
	region: z.string().nullable(),
	isVerified: z.boolean(),
	categoryName: z.string().nullable(),
	matchScore: z.number().int().nullable(),
	rationale: z.string().nullable(),
});
export type WeddingRecommendationSchema = z.infer<
	typeof WeddingRecommendationSchema
>;

/**
 * Aggregated planning snapshot for the couple dashboard: checklist progress,
 * a budget snapshot (the couple's total budget vs. what's been paid), the size
 * of their vendor team, and top suggested matches.
 */
/**
 * A vendor on the couple's wedding team — either shortlisted ("saved") or
 * engaged via a booking. `bookingStatus` is null for save-only members.
 */
export const WeddingTeamMemberSchema = z.object({
	vendorBusinessUuid: z.string().uuid(),
	businessName: z.string(),
	city: z.string().nullable(),
	region: z.string().nullable(),
	isVerified: z.boolean(),
	logoUrl: z.string().nullable(),
	primaryCategoryName: z.string().nullable(),
	isSaved: z.boolean(),
	isBooked: z.boolean(),
	bookingStatus: BookingStatusEnum.nullable(),
});
export type WeddingTeamMemberSchema = z.infer<typeof WeddingTeamMemberSchema>;

/** A vendor category the team doesn't cover yet — a prompt to go discover. */
export const WeddingTeamCategoryGapSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	slug: z.string(),
});
export type WeddingTeamCategoryGapSchema = z.infer<
	typeof WeddingTeamCategoryGapSchema
>;

/** The couple's roster plus the categories still missing a team member. */
export const WeddingTeamSchema = z.object({
	members: z.array(WeddingTeamMemberSchema),
	missingCategories: z.array(WeddingTeamCategoryGapSchema),
});
export type WeddingTeamSchema = z.infer<typeof WeddingTeamSchema>;

export const WeddingSummarySchema = z.object({
	wedding: z.object({
		weddingDate: z.date().nullable(),
		city: z.string().nullable(),
		region: z.string().nullable(),
		guestCountEstimate: z.number().int().nullable(),
	}),
	checklist: z.object({
		done: z.number().int(),
		total: z.number().int(),
	}),
	budget: z.object({
		estimatedCents: z.number().int().nullable(),
		paidCents: z.number().int(),
	}),
	teamCount: z.number().int(),
	recommendations: z.array(WeddingRecommendationSchema),
});
export type WeddingSummarySchema = z.infer<typeof WeddingSummarySchema>;
