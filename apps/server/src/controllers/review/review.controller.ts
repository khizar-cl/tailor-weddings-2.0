import { Roles } from "@repo/shared";
import { requireRole } from "../../orpc/middleware";
import { protectedProcedure } from "../../orpc/procedures";
import {
	listForBusiness,
	listMyRequests,
	moderateReview,
	submitReview,
} from "./review.service";

export const reviewController = {
	listForBusiness: protectedProcedure.review.listForBusiness.handler(
		async ({ input }) => {
			return listForBusiness(input);
		},
	),
	listMyRequests: protectedProcedure.review.listMyRequests.handler(
		async ({ context }) => {
			return listMyRequests(context.dbUser.id);
		},
	),
	submitReview: protectedProcedure.review.submitReview.handler(
		async ({ context, input }) => {
			return submitReview(context.dbUser.id, input);
		},
	),
	moderate: protectedProcedure.review.moderate
		.use(requireRole(Roles.ADMIN))
		.handler(async ({ context, input }) => {
			return moderateReview(context.dbUser.id, input);
		}),
};
