import { oc } from "@orpc/contract";
import {
	AddBudgetItemInputSchema,
	BudgetItemSchema,
	BudgetItemUuidInputSchema,
	BudgetListSchema,
	DeleteBudgetItemResultSchema,
	UpdateBudgetItemInputSchema,
} from "@repo/shared";

export const budgetContract = {
	list: oc.output(BudgetListSchema),
	addItem: oc.input(AddBudgetItemInputSchema).output(BudgetItemSchema),
	updateItem: oc.input(UpdateBudgetItemInputSchema).output(BudgetItemSchema),
	deleteItem: oc
		.input(BudgetItemUuidInputSchema)
		.output(DeleteBudgetItemResultSchema),
};
