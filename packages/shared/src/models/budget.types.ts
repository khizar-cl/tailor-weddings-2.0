import { z } from "zod";
import { ContentSourceEnum } from "./wedding.types";

/**
 * A single line in the budget tracker. "manual" lines are the couple's own
 * expenses; "booking" lines are auto-populated from a confirmed vendor booking
 * (carrying the vendor's name), and "generated" lines come from the planner.
 * `category` is the resolved display name (from a seeded category or the
 * couple's custom text); `categoryUuid` is set only when it's a seeded category,
 * letting the edit form pre-select it.
 */
export const BudgetItemSchema = z.object({
	uuid: z.string().uuid(),
	category: z.string(),
	categoryUuid: z.string().uuid().nullable(),
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

/**
 * A budget line is filed under exactly one category: either an existing seeded
 * category (`categoryUuid`) or the couple's own free text (`customCategory`).
 * The refine enforces the XOR that the DB check constraint also guards.
 */
const oneCategoryMessage = "Choose a category or enter a custom one, not both";

export const AddBudgetItemInputSchema = z
	.object({
		categoryUuid: z.string().uuid().optional(),
		customCategory: z.string().trim().min(1).max(120).optional(),
		label: z.string().trim().min(1, "Enter a label").max(200),
		estimatedCents: z.number().int().min(0).optional(),
		actualCents: z.number().int().min(0).optional(),
	})
	.refine((v) => Boolean(v.categoryUuid) !== Boolean(v.customCategory), {
		message: oneCategoryMessage,
	});
export type AddBudgetItemInputSchema = z.infer<typeof AddBudgetItemInputSchema>;

export const UpdateBudgetItemInputSchema = z
	.object({
		uuid: z.string().uuid(),
		categoryUuid: z.string().uuid().optional(),
		customCategory: z.string().trim().min(1).max(120).optional(),
		label: z.string().trim().min(1, "Enter a label").max(200),
		estimatedCents: z.number().int().min(0).nullable().optional(),
		actualCents: z.number().int().min(0).nullable().optional(),
	})
	.refine((v) => Boolean(v.categoryUuid) !== Boolean(v.customCategory), {
		message: oneCategoryMessage,
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
