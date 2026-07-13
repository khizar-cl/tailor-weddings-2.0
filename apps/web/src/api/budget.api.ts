import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export function useBudget() {
	return useQuery(orpc.budget.list.queryOptions());
}

function useBudgetInvalidator() {
	const queryClient = useQueryClient();
	const listKey = orpc.budget.list.queryOptions().queryKey;
	return () => queryClient.invalidateQueries({ queryKey: listKey });
}

export function useAddBudgetItem() {
	const invalidate = useBudgetInvalidator();
	return useMutation(
		orpc.budget.addItem.mutationOptions({ onSuccess: invalidate }),
	);
}

export function useUpdateBudgetItem() {
	const invalidate = useBudgetInvalidator();
	return useMutation(
		orpc.budget.updateItem.mutationOptions({ onSuccess: invalidate }),
	);
}

export function useDeleteBudgetItem() {
	const invalidate = useBudgetInvalidator();
	return useMutation(
		orpc.budget.deleteItem.mutationOptions({ onSuccess: invalidate }),
	);
}
