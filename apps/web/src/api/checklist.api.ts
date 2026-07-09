import type {
	ChecklistListSchema,
	ToggleChecklistTaskInputSchema,
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export function useChecklist() {
	return useQuery(orpc.checklist.list.queryOptions());
}

export function useToggleChecklistTask() {
	const queryClient = useQueryClient();
	const listKey = orpc.checklist.list.queryOptions().queryKey;

	return useMutation(
		orpc.checklist.toggleComplete.mutationOptions({
			// Flip the checkbox immediately; roll back if the request fails.
			onMutate: async (input: ToggleChecklistTaskInputSchema) => {
				await queryClient.cancelQueries({ queryKey: listKey });
				const previous = queryClient.getQueryData<ChecklistListSchema>(listKey);
				if (previous) {
					queryClient.setQueryData<ChecklistListSchema>(listKey, {
						items: previous.items.map((item) =>
							item.uuid === input.uuid
								? { ...item, isComplete: input.isComplete }
								: item,
						),
					});
				}
				return { previous };
			},
			onError: (_error, _input, context) => {
				if (context?.previous) {
					queryClient.setQueryData(listKey, context.previous);
				}
			},
			onSettled: () => {
				queryClient.invalidateQueries({ queryKey: listKey });
			},
		}),
	);
}

export function useAddChecklistTask() {
	const queryClient = useQueryClient();
	const listKey = orpc.checklist.list.queryOptions().queryKey;

	return useMutation(
		orpc.checklist.addTask.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: listKey });
			},
		}),
	);
}

export function useRemoveChecklistTask() {
	const queryClient = useQueryClient();
	const listKey = orpc.checklist.list.queryOptions().queryKey;

	return useMutation(
		orpc.checklist.removeTask.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: listKey });
			},
		}),
	);
}
