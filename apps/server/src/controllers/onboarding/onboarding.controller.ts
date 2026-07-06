import { protectedProcedure } from "../../orpc/procedures";
import {
	submitCoupleOnboarding,
	submitVendorOnboarding,
} from "./onboarding.service";

export const onboardingController = {
	submitCouple: protectedProcedure.onboarding.submitCouple.handler(
		async ({ context, input }) => {
			return submitCoupleOnboarding(context.dbUser.id, input);
		},
	),

	submitVendor: protectedProcedure.onboarding.submitVendor.handler(
		async ({ context, input }) => {
			return submitVendorOnboarding(context.dbUser.id, input);
		},
	),
};
