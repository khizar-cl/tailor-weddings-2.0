import { protectedProcedure } from "../../orpc/procedures";
import { getWeddingSummary, getWeddingTeam } from "./wedding.service";

export const weddingController = {
	getSummary: protectedProcedure.wedding.getSummary.handler(
		async ({ context }) => {
			return getWeddingSummary(context.dbUser.id);
		},
	),
	getTeam: protectedProcedure.wedding.getTeam.handler(async ({ context }) => {
		return getWeddingTeam(context.dbUser.id);
	}),
};
