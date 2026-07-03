import { z } from "zod";

// Paired with the pgEnums in apps/server/src/db/schema/enums.schema.ts —
// keep the values aligned (DB schema + runtime validation).

export const SubscriptionTierEnum = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierEnum>;

export const SubscriptionStatusEnum = z.enum([
	"trialing",
	"active",
	"past_due",
	"canceled",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const PriceUnitEnum = z.enum(["flat", "hourly", "per_guest"]);
export type PriceUnit = z.infer<typeof PriceUnitEnum>;

/**
 * Per-tier feature limits. Read on the server to gate publishing / uploads and
 * on the client to show limits and upgrade prompts. Infinity encodes "no cap".
 */
export const TIER_LIMITS = {
	free: { maxPublishedProfiles: 1, maxPortfolioImages: 10 },
	pro: {
		maxPublishedProfiles: Number.POSITIVE_INFINITY,
		maxPortfolioImages: Number.POSITIVE_INFINITY,
	},
} as const satisfies Record<
	SubscriptionTier,
	{ maxPublishedProfiles: number; maxPortfolioImages: number }
>;
