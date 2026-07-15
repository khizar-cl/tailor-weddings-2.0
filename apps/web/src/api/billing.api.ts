import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "../utils/orpc";

export function useSubscription() {
	return useQuery(orpc.billing.getSubscription.queryOptions());
}

/** Redirect to Stripe Checkout to start the pro subscription. */
export function useStartCheckout() {
	return useMutation(
		orpc.billing.createCheckoutSession.mutationOptions({
			onSuccess: (data) => {
				window.location.href = data.url;
			},
			onError: () => {
				toast.error("Couldn't start checkout. Please try again.");
			},
		}),
	);
}

/** Redirect to the Stripe billing portal to manage the subscription. */
export function useOpenBillingPortal() {
	return useMutation(
		orpc.billing.createPortalSession.mutationOptions({
			onSuccess: (data) => {
				window.location.href = data.url;
			},
			onError: () => {
				toast.error("Couldn't open the billing portal. Please try again.");
			},
		}),
	);
}
