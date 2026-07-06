import type { MeSchema } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

function useMeCacheUpdater() {
	const queryClient = useQueryClient();
	return (data: MeSchema) => {
		queryClient.setQueryData(orpc.user.me.queryOptions().queryKey, data);
	};
}

/** Switch the active workspace between an already-owned couple/vendor side. */
export function useSetActiveMode() {
	const updateMe = useMeCacheUpdater();
	return useMutation(
		orpc.user.setActiveMode.mutationOptions({ onSuccess: updateMe }),
	);
}

/** Provision the other capability (couple/vendor) and switch into it. */
export function useAddCapability() {
	const updateMe = useMeCacheUpdater();
	return useMutation(
		orpc.auth.addCapability.mutationOptions({ onSuccess: updateMe }),
	);
}
