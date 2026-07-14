import type { BudgetItemSchema } from "@repo/shared";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
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
					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button
									tone="destructive"
									variant="ghost"
									size="icon-sm"
									aria-label={`Delete ${item.label}`}
									disabled={isDeleting}
								/>
							}
						>
							<Trash2Icon className="size-4" />
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Remove this budget line?</AlertDialogTitle>
								<AlertDialogDescription>
									"{item.label}" will be removed from your budget. You can't
									undo this.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={() => onDelete(item.uuid)}>
									Remove
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}

function columnTotals(items: BudgetItemSchema[]) {
	let paid = 0;
	let estimated = 0;
	for (const item of items) {
		paid += item.actualCents ?? 0;
		estimated += item.estimatedCents ?? 0;
	}
	return { paid, estimated };
}

interface BudgetActions {
	onEdit: (item: BudgetItemSchema) => void;
	onDelete: (uuid: string) => void;
	isDeleting: boolean;
}

function BudgetColumn({
	title,
	description,
	items,
	emptyLabel,
	onEdit,
	onDelete,
	isDeleting,
}: BudgetActions & {
	title: string;
	description: string;
	items: BudgetItemSchema[];
	emptyLabel: string;
}) {
	const { paid, estimated } = columnTotals(items);
	return (
		<section className="flex flex-col">
			<header className="flex items-baseline justify-between gap-3 border-border border-b pb-2">
				<div className="min-w-0">
					<h2 className="font-serif text-foreground text-lg">{title}</h2>
					<p className="text-muted-foreground text-xs">{description}</p>
				</div>
				<p className="docket-num shrink-0 text-right text-sm">
					<span className="text-foreground">{formatCents(paid)}</span>
					<span className="text-muted-foreground">
						{" / "}
						{formatCents(estimated)}
					</span>
				</p>
			</header>
			{items.length === 0 ? (
				<div className="mt-4 border border-border border-dashed p-6 text-center">
					<p className="text-muted-foreground text-sm">{emptyLabel}</p>
				</div>
			) : (
				<div className="mt-4 flex flex-col gap-8">
					{groupByCategory(items).map(([category, lines]) => (
						<div key={category}>
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
						</div>
					))}
				</div>
			)}
		</section>
	);
}

/**
 * Splits the budget into vendor bookings (auto-added on confirmation) and the
 * couple's own manual/planner-suggested lines — side by side on desktop,
 * stacked on mobile — each with its own subtotal.
 */
export function BudgetSplit({
	items,
	onEdit,
	onDelete,
	isDeleting,
}: BudgetActions & { items: BudgetItemSchema[] }) {
	const booked = items.filter((item) => item.source === "booking");
	const personal = items.filter((item) => item.source !== "booking");
	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
			<BudgetColumn
				title="Vendor bookings"
				description="Auto-added from confirmed bookings"
				items={booked}
				emptyLabel="No vendor bookings yet."
				onEdit={onEdit}
				onDelete={onDelete}
				isDeleting={isDeleting}
			/>
			<BudgetColumn
				title="Personal & suggested"
				description="Lines you added or the planner suggested"
				items={personal}
				emptyLabel="No personal lines yet."
				onEdit={onEdit}
				onDelete={onDelete}
				isDeleting={isDeleting}
			/>
		</div>
	);
}
