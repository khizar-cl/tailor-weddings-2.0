import type { WeddingSummarySchema } from "@repo/shared";
import { PanelHeader } from "./panel-header";
import { ProgressBar } from "./progress-bar";

const usd = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

function formatCents(cents: number | null) {
	return cents === null ? "—" : usd.format(Math.round(cents / 100));
}

export function BudgetPanel({
	budget,
}: {
	budget: WeddingSummarySchema["budget"];
}) {
	const { estimatedCents, paidCents } = budget;
	const pct =
		estimatedCents && estimatedCents > 0
			? Math.min(100, Math.round((paidCents / estimatedCents) * 100))
			: 0;

	return (
		<section>
			<PanelHeader
				title="Budget"
				trailing={
					<span className="docket-num text-foreground text-sm">
						{formatCents(paidCents)}{" "}
						<span className="text-muted-foreground">
							/ {formatCents(estimatedCents)}
						</span>
					</span>
				}
			/>
			<div className="mt-4">
				<ProgressBar pct={pct} />
			</div>
			<p className="docket mt-2">{pct}% paid</p>
		</section>
	);
}
