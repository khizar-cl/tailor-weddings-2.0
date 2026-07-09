import type {
	SaveVendorInputSchema,
	UnsaveVendorInputSchema,
	VendorDetailSchema,
	VendorSearchInputSchema,
	VendorSearchResultSchema,
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "../utils/orpc";

export function useVendorSearch(input: VendorSearchInputSchema) {
	return useQuery(orpc.vendor.search.queryOptions({ input }));
}

export function useVendorDetail(uuid: string) {
	return useQuery(orpc.vendor.getByUuid.queryOptions({ input: { uuid } }));
}

/**
 * Patch `isSaved` for a vendor across every cached search page and its detail
 * view, so the toggle feels instant without refetching (which would reorder the
 * list). Returns the snapshots needed to roll back on error.
 */
function useOptimisticSaveToggle() {
	const queryClient = useQueryClient();

	return {
		queryClient,
		apply: async (vendorBusinessUuid: string, isSaved: boolean) => {
			const searchKey = orpc.vendor.search.key();
			const detailKey = orpc.vendor.getByUuid.queryOptions({
				input: { uuid: vendorBusinessUuid },
			}).queryKey;

			await Promise.all([
				queryClient.cancelQueries({ queryKey: searchKey }),
				queryClient.cancelQueries({ queryKey: detailKey }),
			]);

			const prevSearches = queryClient.getQueriesData<VendorSearchResultSchema>(
				{
					queryKey: searchKey,
				},
			);
			const prevDetail =
				queryClient.getQueryData<VendorDetailSchema>(detailKey);

			queryClient.setQueriesData<VendorSearchResultSchema>(
				{ queryKey: searchKey },
				(old) =>
					old
						? {
								...old,
								items: old.items.map((item) =>
									item.uuid === vendorBusinessUuid
										? { ...item, isSaved }
										: item,
								),
							}
						: old,
			);
			if (prevDetail) {
				queryClient.setQueryData<VendorDetailSchema>(detailKey, {
					...prevDetail,
					isSaved,
				});
			}

			return { prevSearches, prevDetail, detailKey };
		},
	};
}

type SaveContext = {
	prevSearches: [readonly unknown[], VendorSearchResultSchema | undefined][];
	prevDetail: VendorDetailSchema | undefined;
	detailKey: readonly unknown[];
};

function rollback(
	queryClient: ReturnType<typeof useQueryClient>,
	context: SaveContext | undefined,
) {
	if (!context) return;
	for (const [key, data] of context.prevSearches) {
		queryClient.setQueryData(key, data);
	}
	queryClient.setQueryData(context.detailKey, context.prevDetail);
}

export function useSaveVendor() {
	const { queryClient, apply } = useOptimisticSaveToggle();

	return useMutation(
		orpc.savedVendor.save.mutationOptions({
			onMutate: (input: SaveVendorInputSchema) =>
				apply(input.vendorBusinessUuid, true),
			onError: (_error, _input, context) => rollback(queryClient, context),
			onSuccess: () => toast.success("Saved to your team"),
			onSettled: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.savedVendor.list.key(),
				});
			},
		}),
	);
}

export function useUnsaveVendor() {
	const { queryClient, apply } = useOptimisticSaveToggle();

	return useMutation(
		orpc.savedVendor.unsave.mutationOptions({
			onMutate: (input: UnsaveVendorInputSchema) =>
				apply(input.vendorBusinessUuid, false),
			onError: (_error, _input, context) => rollback(queryClient, context),
			onSuccess: () => toast.success("Removed from your team"),
			onSettled: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.savedVendor.list.key(),
				});
			},
		}),
	);
}
