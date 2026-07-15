import { z } from "zod";
import { SubscriptionStatusEnum, SubscriptionTierEnum } from "./vendor.types";

/** A redirect URL to a Stripe-hosted page (Checkout or the billing portal). */
export const StripeRedirectSchema = z.object({
	url: z.string().url(),
});
export type StripeRedirectSchema = z.infer<typeof StripeRedirectSchema>;

/**
 * The vendor's current plan, mirrored from Stripe. `tier` is the gate that
 * `TIER_LIMITS` reads; `status`/`currentPeriodEnd` are null until a paid
 * subscription exists.
 */
export const VendorSubscriptionSchema = z.object({
	tier: SubscriptionTierEnum,
	status: SubscriptionStatusEnum.nullable(),
	currentPeriodEnd: z.date().nullable(),
});
export type VendorSubscriptionSchema = z.infer<typeof VendorSubscriptionSchema>;
