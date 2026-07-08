import { protectedProcedure } from "../../orpc/procedures";
import {
	addChecklistTask,
	listChecklist,
	removeChecklistTask,
	toggleChecklistTask,
} from "./checklist.service";

export const checklistController = {
	list: protectedProcedure.checklist.list.handler(async ({ context }) => {
		return listChecklist(context.dbUser.id);
	}),

	addTask: protectedProcedure.checklist.addTask.handler(
		async ({ context, input }) => {
			return addChecklistTask(context.dbUser.id, input);
		},
	),

	toggleComplete: protectedProcedure.checklist.toggleComplete.handler(
		async ({ context, input }) => {
			return toggleChecklistTask(context.dbUser.id, input);
		},
	),

	removeTask: protectedProcedure.checklist.removeTask.handler(
		async ({ context, input }) => {
			return removeChecklistTask(context.dbUser.id, input.uuid);
		},
	),
};
