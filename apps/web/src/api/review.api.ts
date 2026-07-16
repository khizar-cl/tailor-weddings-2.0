import type { ListReviewsInputSchema } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "../utils/orpc";

/** Published reviews for a business — the vendor detail page and reviews-received. */
export function useBusinessReviews(
	input: ListReviewsInputSchema,
	options?: { enabled?: boolean },
) {
	return useQuery({
		...orpc.review.listForBusiness.queryOptions({ input }),
		enabled: options?.enabled ?? true,
	});
}

/** The caller's open review prompts (client for couples, peer for vendors). */
export function useMyReviewRequests() {
	return useQuery(orpc.review.listMyRequests.queryOptions());
}

export function useSubmitReview() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.review.submitReview.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.review.listMyRequests.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.review.listForBusiness.key(),
				});
				toast.success(
					"Thanks — your review posts once the wedding's reviews go live.",
				);
			},
		}),
	);
}
