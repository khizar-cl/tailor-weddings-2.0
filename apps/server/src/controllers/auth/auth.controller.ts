import { protectedProcedure } from "../../orpc/procedures";
import { addCapability, completeUserProfile } from "./auth.service";

export const authController = {
	completeProfile: protectedProcedure.auth.completeProfile.handler(
		async ({ context, input }) => {
			return completeUserProfile(context.dbUser.id, input);
		},
	),

	addCapability: protectedProcedure.auth.addCapability.handler(
		async ({ context, input }) => {
			return addCapability(context.dbUser.id, input.capability);
		},
	),
};
