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
 * Per-tier feature limits. A vendor has one business offering many services
 * (categories); these gate how many services it may offer and how many
 * portfolio images each service may hold. Read on the server to enforce, and on
 * the client to show limits / upgrade prompts.
 */
export const TIER_LIMITS = {
	free: {
		maxServices: 1,
		maxPortfolioImagesPerService: 5,
		priorityMatching: false,
	},
	pro: {
		maxServices: 10,
		maxPortfolioImagesPerService: 20,
		priorityMatching: true,
	},
} as const satisfies Record<
	SubscriptionTier,
	{
		maxServices: number;
		maxPortfolioImagesPerService: number;
		priorityMatching: boolean;
	}
>;
