import type { WeddingSummarySchema } from "@repo/shared";
import { cn } from "@repo/ui/lib/utils";
import { differenceInCalendarDays, format } from "date-fns";

function daysToGo(weddingDate: Date | null) {
	if (!weddingDate) return null;
	return Math.max(0, differenceInCalendarDays(weddingDate, new Date()));
}

function SpecItem({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<dt className="docket">{label}</dt>
			<dd
				className={cn(
					"mt-1 text-foreground text-sm",
					mono ? "docket-num" : "font-medium",
				)}
			>
				{value}
			</dd>
		</div>
	);
}

export function Masthead({
	firstName,
	summary,
}: {
	firstName: string;
	summary: WeddingSummarySchema;
}) {
	const { weddingDate, city, region, guestCountEstimate } = summary.wedding;
	const days = daysToGo(weddingDate);
	const location = [city, region].filter(Boolean).join(", ") || "—";

	return (
		<section className="flex flex-col gap-6 border-border border-b pb-8">
			<div>
				<span className="docket text-thread-ink">
					Welcome back, {firstName}
				</span>
				{days === null ? (
					<h1 className="mt-3 font-medium font-serif text-3xl text-foreground sm:text-4xl">
						Let's set your date
					</h1>
				) : (
					<p className="mt-2 flex items-baseline gap-3">
						<span className="docket-num text-5xl text-foreground sm:text-6xl">
							{days}
						</span>
						<span className="font-medium font-serif text-2xl text-foreground sm:text-3xl">
							days to go
						</span>
					</p>
				)}
				<p className="mt-3 max-w-md text-muted-foreground text-sm">
					Here's what's coming together for your day.
				</p>
			</div>
			<dl className="flex flex-wrap gap-x-10 gap-y-4">
				<SpecItem
					label="Date"
					mono
					value={weddingDate ? format(weddingDate, "MMM d, yyyy") : "—"}
				/>
				<SpecItem label="Location" value={location} />
				<SpecItem
					label="Guests"
					mono
					value={guestCountEstimate?.toString() ?? "—"}
				/>
				<SpecItem
					label="Team"
					mono
					value={`${summary.teamCount} ${summary.teamCount === 1 ? "vendor" : "vendors"}`}
				/>
			</dl>
		</section>
	);
}
