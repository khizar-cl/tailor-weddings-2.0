import { z } from "zod";
import { ContentSourceEnum } from "./wedding.types";

/**
 * A single task on a couple's planning checklist. `source` distinguishes
 * planner-generated tasks from ones the couple added themselves ("manual").
 */
export const ChecklistItemSchema = z.object({
	uuid: z.string().uuid(),
	title: z.string(),
	description: z.string().nullable(),
	// The linked vendor category, or null for uncategorized / "other" tasks.
	category: z.object({ uuid: z.string().uuid(), name: z.string() }).nullable(),
	dueDate: z.date().nullable(),
	isComplete: z.boolean(),
	source: ContentSourceEnum,
	sortOrder: z.number().int(),
});
export type ChecklistItemSchema = z.infer<typeof ChecklistItemSchema>;

export const ChecklistListSchema = z.object({
	items: z.array(ChecklistItemSchema),
});
export type ChecklistListSchema = z.infer<typeof ChecklistListSchema>;

/** A task the couple adds themselves (always persisted with source "manual"). */
export const AddChecklistTaskInputSchema = z.object({
	title: z.string().trim().min(1, "Enter a task").max(200),
	description: z.string().trim().max(1000).optional(),
	// Optional link to a vendor category; omit for an uncategorized task.
	categoryUuid: z.string().uuid("Choose a valid category").optional(),
	dueDate: z.coerce.date().optional(),
});
export type AddChecklistTaskInputSchema = z.infer<
	typeof AddChecklistTaskInputSchema
>;

export const ToggleChecklistTaskInputSchema = z.object({
	uuid: z.string().uuid(),
	isComplete: z.boolean(),
});
export type ToggleChecklistTaskInputSchema = z.infer<
	typeof ToggleChecklistTaskInputSchema
>;

export const ChecklistTaskUuidInputSchema = z.object({
	uuid: z.string().uuid(),
});
export type ChecklistTaskUuidInputSchema = z.infer<
	typeof ChecklistTaskUuidInputSchema
>;

export const RemoveChecklistTaskResultSchema = z.object({
	deleted: z.boolean(),
});
export type RemoveChecklistTaskResultSchema = z.infer<
	typeof RemoveChecklistTaskResultSchema
>;
