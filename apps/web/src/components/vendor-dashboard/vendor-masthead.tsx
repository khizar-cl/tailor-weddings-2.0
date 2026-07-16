import type { SubscriptionTier } from "@repo/shared";
import { cn } from "@repo/ui/lib/utils";

function SpecItem({
	label,
	value,
	mono = false,
	trailing,
}: {
	label: string;
	value: string;
	mono?: boolean;
	trailing?: React.ReactNode;
}) {
	return (
		<div className="min-w-0">
			<dt className="docket">{label}</dt>
			<dd className="mt-1 flex items-center gap-2">
				<span
					className={cn(
						"truncate text-foreground text-sm",
						mono ? "docket-num" : "font-medium",
					)}
				>
					{value}
				</span>
				{trailing}
			</dd>
		</div>
	);
}

export function VendorMasthead({
	firstName,
	businessName,
	location,
	isVerified,
	liveServices,
	totalServices,
	tier,
	pendingRequests,
}: {
	firstName: string;
	businessName: string;
	location: string;
	isVerified: boolean;
	liveServices: number;
	totalServices: number;
	tier: SubscriptionTier;
	pendingRequests: number;
}) {
	const hasPending = pendingRequests > 0;

	return (
		<section className="flex flex-col gap-6 border-border border-b pb-8">
			<div>
				<span className="docket text-thread-ink">
					Welcome back, {firstName}
				</span>
				{hasPending ? (
					<p className="mt-2 flex items-baseline gap-3">
						<span className="docket-num text-5xl text-foreground sm:text-6xl">
							{pendingRequests}
						</span>
						<span className="font-medium font-serif text-2xl text-foreground sm:text-3xl">
							{pendingRequests === 1 ? "request awaits" : "requests await"}
						</span>
					</p>
				) : (
					<h1 className="mt-3 font-medium font-serif text-3xl text-foreground sm:text-4xl">
						{liveServices === 0
							? "Let's get you discovered"
							: "You're all caught up"}
					</h1>
				)}
				<p className="mt-3 max-w-md text-muted-foreground text-sm">
					{hasPending
						? "Couples are waiting on your reply in Requests."
						: liveServices === 0
							? "Publish a service so couples can find and book your studio."
							: "Your studio is live — here's how it's coming along."}
				</p>
			</div>
			<dl className="flex flex-wrap gap-x-10 gap-y-4">
				<SpecItem
					label="Studio"
					value={businessName}
					trailing={
						isVerified ? (
							<span className="docket text-thread-ink">Verified</span>
						) : undefined
					}
				/>
				<SpecItem label="Location" value={location || "—"} />
				<SpecItem
					label="Live services"
					mono
					value={`${liveServices}/${totalServices}`}
				/>
				<SpecItem label="Plan" value={tier === "pro" ? "Pro" : "Free"} />
			</dl>
		</section>
	);
}
