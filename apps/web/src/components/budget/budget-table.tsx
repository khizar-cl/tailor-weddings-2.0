import type { BudgetItemSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { ProgressBar } from "../dashboard/progress-bar";
import { formatCents } from "../vendor/price";

function groupByCategory(items: BudgetItemSchema[]) {
	const groups = new Map<string, BudgetItemSchema[]>();
	for (const item of items) {
		const bucket = groups.get(item.category);
		if (bucket) bucket.push(item);
		else groups.set(item.category, [item]);
	}
	return [...groups.entries()];
}

function BudgetRow({
	item,
	onEdit,
	onDelete,
	isDeleting,
}: {
	item: BudgetItemSchema;
	onEdit: (item: BudgetItemSchema) => void;
	onDelete: (uuid: string) => void;
	isDeleting: boolean;
}) {
	const paid = item.actualCents ?? 0;
	const estimated = item.estimatedCents;
	const pct =
		estimated && estimated > 0
			? Math.min(100, Math.round((paid / estimated) * 100))
			: 0;

	return (
		<div className="flex flex-col gap-2 border-border border-b py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
			<div className="min-w-0 sm:flex-1">
				<p className="text-foreground text-sm">{item.label}</p>
				{item.vendorBusinessName && (
					<p className="docket mt-0.5 text-thread-ink">
						{item.vendorBusinessName}
					</p>
				)}
			</div>
			<div className="flex items-center gap-3">
				<div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
					<p className="docket-num text-right text-sm">
						<span className="text-foreground">{formatCents(paid)}</span>
						<span className="text-muted-foreground">
							{" / "}
							{estimated === null ? "—" : formatCents(estimated)}
						</span>
					</p>
					{estimated !== null && (
						<div className="mt-1.5">
							<ProgressBar pct={pct} />
						</div>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<Button
						tone="secondary"
						variant="ghost"
						size="icon-sm"
						aria-label={`Edit ${item.label}`}
						onClick={() => onEdit(item)}
					>
						<PencilIcon className="size-4" />
					</Button>
					<Button
						tone="destructive"
						variant="ghost"
						size="icon-sm"
						aria-label={`Delete ${item.label}`}
						disabled={isDeleting}
						onClick={() => onDelete(item.uuid)}
					>
						<Trash2Icon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export function BudgetTable({
	items,
	onEdit,
	onDelete,
	isDeleting,
}: {
	items: BudgetItemSchema[];
	onEdit: (item: BudgetItemSchema) => void;
	onDelete: (uuid: string) => void;
	isDeleting: boolean;
}) {
	return (
		<div className="flex flex-col gap-8">
			{groupByCategory(items).map(([category, lines]) => (
				<section key={category}>
					<h3 className="docket border-border border-b pb-2 text-thread-ink">
						{category}
					</h3>
					<div className="mt-1">
						{lines.map((item) => (
							<BudgetRow
								key={item.uuid}
								item={item}
								onEdit={onEdit}
								onDelete={onDelete}
								isDeleting={isDeleting}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
