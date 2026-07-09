import { protectedProcedure } from "../../orpc/procedures";
import { getWeddingSummary } from "./wedding.service";

export const weddingController = {
	getSummary: protectedProcedure.wedding.getSummary.handler(
		async ({ context }) => {
			return getWeddingSummary(context.dbUser.id);
		},
	),
};
