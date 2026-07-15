import { oc } from "@orpc/contract";
import { StripeRedirectSchema, VendorSubscriptionSchema } from "@repo/shared";

export const billingContract = {
	getSubscription: oc.output(VendorSubscriptionSchema),
	createCheckoutSession: oc.output(StripeRedirectSchema),
	createPortalSession: oc.output(StripeRedirectSchema),
};
