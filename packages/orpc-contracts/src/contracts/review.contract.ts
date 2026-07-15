import { oc } from "@orpc/contract";
import {
	ListReviewsInputSchema,
	ModerateReviewInputSchema,
	PendingReviewRequestListSchema,
	ReviewListSchema,
	ReviewSchema,
	SubmitReviewInputSchema,
} from "@repo/shared";

export const reviewContract = {
	listForBusiness: oc.input(ListReviewsInputSchema).output(ReviewListSchema),
	listMyRequests: oc.output(PendingReviewRequestListSchema),
	submitReview: oc.input(SubmitReviewInputSchema).output(ReviewSchema),
	moderate: oc.input(ModerateReviewInputSchema).output(ReviewSchema),
};
