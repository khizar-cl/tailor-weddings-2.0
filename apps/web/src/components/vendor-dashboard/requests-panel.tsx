import type { BookingSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { format } from "date-fns";
import Link from "next/link";
import { PanelHeader } from "../dashboard/panel-header";
import { formatCents } from "../vendor/price";

const STATUS: Record<
	BookingSchema["status"],
	{ label: string; tone: "warning" | "success" | "secondary" }
> = {
	pending: { label: "Pending", tone: "warning" },
	confirmed: { label: "Booked", tone: "success" },
	cancelled: { label: "Declined", tone: "secondary" },
};

const PREVIEW_LIMIT = 5;

export function RequestsPanel({
	requests,
	pendingCount,
}: {
	requests: BookingSchema[];
	pendingCount: number;
}) {
	return (
		<section>
			<PanelHeader
				title="Requests"
				trailing={
					pendingCount > 0 ? (
						<span className="docket-num text-foreground text-sm">
							{pendingCount} pending
						</span>
					) : undefined
				}
			/>
			{requests.length === 0 ? (
				<p className="docket mt-6 text-muted-foreground">
					No requests yet — they'll appear here as couples reach out.
				</p>
			) : (
				<>
					<ul className="mt-1">
						{requests.slice(0, PREVIEW_LIMIT).map((booking) => {
							const status = STATUS[booking.status];
							const service = [booking.serviceLabel, booking.packageName]
								.filter(Boolean)
								.join(" · ");
							return (
								<li
									key={booking.uuid}
									className="border-border border-b last:border-0"
								>
									<Link
										href="/portal/vendor/bookings"
										className="group flex items-start justify-between gap-4 py-4"
									>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
												<h3 className="truncate text-sm group-hover:underline">
													{booking.title}
												</h3>
												<Badge tone={status.tone} variant="outline">
													{status.label}
												</Badge>
											</div>
											{service && <p className="docket mt-0.5">{service}</p>}
											{booking.weddingDate && (
												<p className="mt-1 text-muted-foreground text-xs">
													Wedding {format(booking.weddingDate, "MMM d, yyyy")}
												</p>
											)}
										</div>
										<span className="docket-num shrink-0 text-foreground text-sm">
											{formatCents(booking.packagePriceCents)}
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
					<Link
						href="/portal/vendor/bookings"
						className="mt-4 inline-flex items-center text-primary text-sm hover:underline"
					>
						View all requests →
					</Link>
				</>
			)}
		</section>
	);
}
