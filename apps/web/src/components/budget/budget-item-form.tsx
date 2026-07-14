import type { BudgetItemSchema, CategoryItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMemo } from "react";
import { z } from "zod";
import { useAddBudgetItem, useUpdateBudgetItem } from "../../api/budget.api";
import { CreatableCombobox } from "../creatable-combobox";
import { centsToDollars, dollarsToCents } from "../vendor/price";

const BudgetFormSchema = z.object({
	category: z.string().trim().min(1, "Enter a category").max(120),
	label: z.string().trim().min(1, "Enter a label").max(200),
	estimated: z.string().trim(),
	actual: z.string().trim(),
});

export function BudgetItemForm({
	item,
	categories,
	customCategories,
	onDone,
}: {
	item?: BudgetItemSchema;
	/** Seeded categories the line can be filed under (name → uuid). */
	categories: CategoryItem[];
	/** Custom category names the couple has already used, for reuse. */
	customCategories: string[];
	onDone: () => void;
}) {
	const add = useAddBudgetItem();
	const update = useUpdateBudgetItem();
	const isPending = add.isPending || update.isPending;

	const uuidByName = useMemo(
		() => new Map(categories.map((c) => [c.name, c.uuid])),
		[categories],
	);
	const categoryOptions = useMemo(
		() => [...new Set([...categories.map((c) => c.name), ...customCategories])],
		[categories, customCategories],
	);

	const form = useForm({
		defaultValues: {
			category: item?.category ?? "",
			label: item?.label ?? "",
			estimated: centsToDollars(item?.estimatedCents ?? null),
			actual: centsToDollars(item?.actualCents ?? null),
		},
		validators: { onChange: BudgetFormSchema },
		onSubmit: ({ value }) => {
			const category = value.category.trim();
			const label = value.label.trim();
			// A name that matches a seeded category links by uuid; anything else is
			// a custom category. Exactly one, per the input's XOR validation.
			const categoryUuid = uuidByName.get(category);
			const categoryFields = categoryUuid
				? { categoryUuid }
				: { customCategory: category };
			if (item) {
				update.mutate(
					{
						uuid: item.uuid,
						...categoryFields,
						label,
						estimatedCents: dollarsToCents(value.estimated) ?? null,
						actualCents: dollarsToCents(value.actual) ?? null,
					},
					{ onSuccess: onDone },
				);
			} else {
				add.mutate(
					{
						...categoryFields,
						label,
						estimatedCents: dollarsToCents(value.estimated),
						actualCents: dollarsToCents(value.actual),
					},
					{ onSuccess: onDone },
				);
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4"
		>
			<form.Field
				name="category"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="budget-category">Category</Label>
						<CreatableCombobox
							id="budget-category"
							items={categoryOptions}
							value={field.state.value}
							onValueChange={field.handleChange}
							placeholder="Search or add a category"
						/>
					</div>
				)}
			/>
			<form.Field
				name="label"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="budget-label">Item</Label>
						<Input
							id="budget-label"
							placeholder="e.g. Reception hall"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>
			<div className="form-row">
				<form.Field
					name="estimated"
					children={(field) => (
						<div className="form-container flex-1">
							<Label htmlFor="budget-estimated">Estimated (USD)</Label>
							<Input
								id="budget-estimated"
								type="number"
								min={0}
								placeholder="0"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					)}
				/>
				<form.Field
					name="actual"
					children={(field) => (
						<div className="form-container flex-1">
							<Label htmlFor="budget-actual">Paid (USD)</Label>
							<Input
								id="budget-actual"
								type="number"
								min={0}
								placeholder="0"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					)}
				/>
			</div>
			<div className="form-actions">
				<form.Subscribe
					selector={(s) => ({
						canSubmit: s.canSubmit,
						category: s.values.category,
						label: s.values.label,
					})}
					children={({ canSubmit, category, label }) => {
						const incomplete =
							category.trim().length === 0 || label.trim().length === 0;
						return (
							<Button
								type="submit"
								disabled={isPending || !canSubmit || incomplete}
							>
								{item ? "Save line" : "Add line"}
							</Button>
						);
					}}
				/>
			</div>
		</form>
	);
}
