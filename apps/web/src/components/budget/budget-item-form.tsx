import type { BudgetItemSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useAddBudgetItem, useUpdateBudgetItem } from "../../api/budget.api";
import { centsToDollars, dollarsToCents } from "../vendor/price";

const BudgetFormSchema = z.object({
	category: z.string().trim().min(1, "Enter a category").max(120),
	label: z.string().trim().min(1, "Enter a label").max(200),
	estimated: z.string().trim(),
	actual: z.string().trim(),
});

export function BudgetItemForm({
	item,
	onDone,
}: {
	item?: BudgetItemSchema;
	onDone: () => void;
}) {
	const add = useAddBudgetItem();
	const update = useUpdateBudgetItem();
	const isPending = add.isPending || update.isPending;

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
			if (item) {
				update.mutate(
					{
						uuid: item.uuid,
						category,
						label,
						estimatedCents: dollarsToCents(value.estimated) ?? null,
						actualCents: dollarsToCents(value.actual) ?? null,
					},
					{ onSuccess: onDone },
				);
			} else {
				add.mutate(
					{
						category,
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
						<Input
							id="budget-category"
							placeholder="e.g. Venue"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
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
