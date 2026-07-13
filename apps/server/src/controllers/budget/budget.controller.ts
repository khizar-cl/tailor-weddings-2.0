import { protectedProcedure } from "../../orpc/procedures";
import {
	addBudgetItem,
	deleteBudgetItem,
	listBudget,
	updateBudgetItem,
} from "./budget.service";

export const budgetController = {
	list: protectedProcedure.budget.list.handler(async ({ context }) => {
		return listBudget(context.dbUser.id);
	}),
	addItem: protectedProcedure.budget.addItem.handler(
		async ({ context, input }) => {
			return addBudgetItem(context.dbUser.id, input);
		},
	),
	updateItem: protectedProcedure.budget.updateItem.handler(
		async ({ context, input }) => {
			return updateBudgetItem(context.dbUser.id, input);
		},
	),
	deleteItem: protectedProcedure.budget.deleteItem.handler(
		async ({ context, input }) => {
			return deleteBudgetItem(context.dbUser.id, input.uuid);
		},
	),
};
