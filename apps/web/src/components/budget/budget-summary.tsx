import type { BudgetTotalsSchema } from "@repo/shared";
import { cn } from "@repo/ui/lib/utils";
import { ProgressBar } from "../dashboard/progress-bar";
import { formatCents } from "../vendor/price";

function money(cents: number | null) {
	return cents === null ? "—" : formatCents(cents);
}

function Stat({
	label,
	value,
	emphasize,
}: {
	label: string;
	value: string;
	emphasize?: boolean;
}) {
	return (
		<div>
			<p className="docket text-thread-ink">{label}</p>
			<p
				className={cn(
					"docket-num mt-1 text-lg",
					emphasize ? "text-warning-foreground" : "text-foreground",
				)}
			>
				{value}
			</p>
		</div>
	);
}

export function BudgetSummary({ totals }: { totals: BudgetTotalsSchema }) {
	const { estimatedBudgetCents, estimatedCents, actualCents } = totals;
	const pct =
		estimatedBudgetCents && estimatedBudgetCents > 0
			? Math.min(100, Math.round((actualCents / estimatedBudgetCents) * 100))
			: 0;
	const overBudget =
		estimatedBudgetCents !== null && estimatedCents > estimatedBudgetCents;

	return (
		<section>
			<div className="grid grid-cols-3 gap-4">
				<Stat label="Budget" value={money(estimatedBudgetCents)} />
				<Stat
					label="Allocated"
					value={money(estimatedCents)}
					emphasize={overBudget}
				/>
				<Stat label="Paid" value={money(actualCents)} />
			</div>
			{estimatedBudgetCents !== null && (
				<div className="mt-4">
					<ProgressBar pct={pct} />
					<p className="docket mt-2 text-thread-ink">{pct}% of budget paid</p>
				</div>
			)}
		</section>
	);
}
