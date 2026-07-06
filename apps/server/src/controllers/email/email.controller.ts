import { Roles } from "@repo/shared";
import { requireRole } from "../../orpc/middleware";
import { protectedProcedure } from "../../orpc/procedures";
import { sendInviteEmail } from "./email.service";

export const emailController = {
	invite: protectedProcedure.email.invite
		.use(requireRole(Roles.ADMIN))
		.handler(async ({ context, input }) => {
			return sendInviteEmail(context.dbUser.id, input);
		}),
};
