import { Roles } from "@repo/shared";
import { requireRole } from "../../orpc/middleware";
import { protectedProcedure } from "../../orpc/procedures";
import {
	getMe,
	getUserPreferences,
	listUsers,
	setActiveMode,
	updateUserPreferences,
} from "./user.service";

export const userController = {
	me: protectedProcedure.user.me.handler(async ({ context }) => {
		return getMe(context.dbUser.id);
	}),

	setActiveMode: protectedProcedure.user.setActiveMode.handler(
		async ({ context, input }) => {
			return setActiveMode(context.dbUser.id, input.mode);
		},
	),

	getPreferences: protectedProcedure.user.getPreferences.handler(
		async ({ context }) => {
			return getUserPreferences(context.dbUser.id);
		},
	),

	setPreferences: protectedProcedure.user.setPreferences.handler(
		async ({ context, input }) => {
			return updateUserPreferences(context.dbUser.id, input);
		},
	),

	list: protectedProcedure.user.list
		.use(requireRole(Roles.ADMIN))
		.handler(async () => {
			return listUsers();
		}),
};
