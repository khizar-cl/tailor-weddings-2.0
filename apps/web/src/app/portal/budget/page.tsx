"use client";

import type { BudgetItemSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useBudget, useDeleteBudgetItem } from "../../../api/budget.api";
import { useCategories } from "../../../api/category.api";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import { BudgetItemForm } from "../../../components/budget/budget-item-form";
import { BudgetSummary } from "../../../components/budget/budget-summary";
import { BudgetSplit } from "../../../components/budget/budget-table";
import Loader from "../../../components/loader";

/** null = closed, "new" = add mode, an item = edit mode. */
type DialogState = BudgetItemSchema | "new" | null;

export default function BudgetPage() {
	const budget = useBudget();
	const categories = useCategories();
	const remove = useDeleteBudgetItem();
	const [dialog, setDialog] = useState<DialogState>(null);

	const items = budget.data?.items ?? [];
	const categoryList = categories.data?.categories ?? [];
	// Custom category names already in use, so the picker can offer them again.
	const customCategories = [
		...new Set(
			items
				.filter((item) => item.categoryUuid === null && item.category !== "")
				.map((item) => item.category),
		),
	];

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Planning</span>
					<div className="mt-2 flex items-end justify-between gap-4">
						<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
							Budget
						</h1>
						<Button onClick={() => setDialog("new")}>
							<PlusIcon className="size-4" />
							Add line
						</Button>
					</div>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Track what you've allocated against what you've paid, line by line.
					</p>
				</header>

				{budget.isLoading ? (
					<div className="mt-6">
						<Loader />
					</div>
				) : budget.error ? (
					<p className="mt-6 text-destructive-foreground text-sm">
						{budget.error.message}
					</p>
				) : budget.data ? (
					<div className="mt-6 flex flex-col gap-10">
						<BudgetSummary totals={budget.data.totals} />
						{items.length === 0 ? (
							<div className="border border-border border-dashed p-8 text-center">
								<p className="text-muted-foreground text-sm">
									No budget lines yet. Add your first to start tracking.
								</p>
							</div>
						) : (
							<BudgetSplit
								items={items}
								onEdit={(item) => setDialog(item)}
								onDelete={(uuid) => remove.mutate({ uuid })}
								isDeleting={remove.isPending}
							/>
						)}
					</div>
				) : null}
			</div>

			<Dialog
				open={dialog !== null}
				onOpenChange={(open) => !open && setDialog(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{dialog && dialog !== "new" ? "Edit line" : "Add a line"}
						</DialogTitle>
					</DialogHeader>
					{dialog !== null && (
						<BudgetItemForm
							item={dialog === "new" ? undefined : dialog}
							categories={categoryList}
							customCategories={customCategories}
							onDone={() => setDialog(null)}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
