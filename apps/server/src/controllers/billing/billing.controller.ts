import { protectedProcedure } from "../../orpc/procedures";
import {
	createCheckoutSession,
	createPortalSession,
	getSubscription,
} from "./billing.service";

export const billingController = {
	getSubscription: protectedProcedure.billing.getSubscription.handler(
		async ({ context }) => {
			return getSubscription(context.dbUser.id);
		},
	),
	createCheckoutSession:
		protectedProcedure.billing.createCheckoutSession.handler(
			async ({ context }) => {
				return createCheckoutSession(context.dbUser.id);
			},
		),
	createPortalSession: protectedProcedure.billing.createPortalSession.handler(
		async ({ context }) => {
			return createPortalSession(context.dbUser.id);
		},
	),
};
