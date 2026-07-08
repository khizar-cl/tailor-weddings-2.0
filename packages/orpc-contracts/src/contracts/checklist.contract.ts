import { oc } from "@orpc/contract";
import {
	AddChecklistTaskInputSchema,
	ChecklistItemSchema,
	ChecklistListSchema,
	ChecklistTaskUuidInputSchema,
	RemoveChecklistTaskResultSchema,
	ToggleChecklistTaskInputSchema,
} from "@repo/shared";

export const checklistContract = {
	list: oc.output(ChecklistListSchema),
	addTask: oc.input(AddChecklistTaskInputSchema).output(ChecklistItemSchema),
	toggleComplete: oc
		.input(ToggleChecklistTaskInputSchema)
		.output(ChecklistItemSchema),
	removeTask: oc
		.input(ChecklistTaskUuidInputSchema)
		.output(RemoveChecklistTaskResultSchema),
};
