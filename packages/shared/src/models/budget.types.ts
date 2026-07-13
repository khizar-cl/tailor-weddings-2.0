import { z } from "zod";
import { ContentSourceEnum } from "./wedding.types";

/**
 * A single line in the budget tracker. "manual" lines are the couple's own
 * expenses; "booking" lines are auto-populated from a confirmed vendor booking
 * (carrying the vendor's name), and "generated" lines come from the planner.
 */
export const BudgetItemSchema = z.object({
	uuid: z.string().uuid(),
	category: z.string(),
	label: z.string(),
	estimatedCents: z.number().int().nullable(),
	actualCents: z.number().int().nullable(),
	source: ContentSourceEnum,
	vendorBusinessUuid: z.string().uuid().nullable(),
	vendorBusinessName: z.string().nullable(),
});
export type BudgetItemSchema = z.infer<typeof BudgetItemSchema>;

/**
 * Roll-up for the budget view: the wedding's overall target next to the sum of
 * line estimates and what's actually been paid.
 */
export const BudgetTotalsSchema = z.object({
	estimatedBudgetCents: z.number().int().nullable(),
	estimatedCents: z.number().int(),
	actualCents: z.number().int(),
});
export type BudgetTotalsSchema = z.infer<typeof BudgetTotalsSchema>;

export const BudgetListSchema = z.object({
	items: z.array(BudgetItemSchema),
	totals: BudgetTotalsSchema,
});
export type BudgetListSchema = z.infer<typeof BudgetListSchema>;

export const AddBudgetItemInputSchema = z.object({
	category: z.string().trim().min(1, "Enter a category").max(120),
	label: z.string().trim().min(1, "Enter a label").max(200),
	estimatedCents: z.number().int().min(0).optional(),
	actualCents: z.number().int().min(0).optional(),
});
export type AddBudgetItemInputSchema = z.infer<typeof AddBudgetItemInputSchema>;

export const UpdateBudgetItemInputSchema = z.object({
	uuid: z.string().uuid(),
	category: z.string().trim().min(1, "Enter a category").max(120),
	label: z.string().trim().min(1, "Enter a label").max(200),
	estimatedCents: z.number().int().min(0).nullable().optional(),
	actualCents: z.number().int().min(0).nullable().optional(),
});
export type UpdateBudgetItemInputSchema = z.infer<
	typeof UpdateBudgetItemInputSchema
>;

export const BudgetItemUuidInputSchema = z.object({
	uuid: z.string().uuid(),
});
export type BudgetItemUuidInputSchema = z.infer<
	typeof BudgetItemUuidInputSchema
>;

export const DeleteBudgetItemResultSchema = z.object({
	deleted: z.boolean(),
});
export type DeleteBudgetItemResultSchema = z.infer<
	typeof DeleteBudgetItemResultSchema
>;
