import type { MeSchema } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

function useMeCacheUpdater() {
	const queryClient = useQueryClient();
	return (data: MeSchema) => {
		queryClient.setQueryData(orpc.user.me.queryOptions().queryKey, data);
	};
}

export function useSubmitCoupleOnboarding({
	onSuccess,
}: {
	onSuccess: () => void;
}) {
	const updateMe = useMeCacheUpdater();
	return useMutation(
		orpc.onboarding.submitCouple.mutationOptions({
			onSuccess: (data) => {
				updateMe(data);
				onSuccess();
			},
		}),
	);
}

export function useSubmitVendorOnboarding({
	onSuccess,
}: {
	onSuccess: () => void;
}) {
	const updateMe = useMeCacheUpdater();
	return useMutation(
		orpc.onboarding.submitVendor.mutationOptions({
			onSuccess: (data) => {
				updateMe(data);
				onSuccess();
			},
		}),
	);
}
