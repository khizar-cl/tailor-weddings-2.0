"use client";

import type { BookingSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { format } from "date-fns";
import { CheckIcon, XIcon } from "lucide-react";
import { formatCents } from "../vendor/price";

const STATUS_LABEL: Record<BookingSchema["status"], string> = {
	pending: "Requested",
	confirmed: "Booked",
	cancelled: "Cancelled",
};

const STATUS_TONE: Record<
	BookingSchema["status"],
	"info" | "success" | "secondary"
> = {
	pending: "info",
	confirmed: "success",
	cancelled: "secondary",
};

export function BookingRequestRow({
	booking,
	onConfirm,
	onCancel,
	isBusy,
}: {
	booking: BookingSchema;
	onConfirm: (bookingUuid: string) => void;
	onCancel: (bookingUuid: string) => void;
	isBusy: boolean;
}) {
	const meta = [
		booking.serviceLabel,
		booking.packageName,
		booking.weddingDate && format(booking.weddingDate, "MMM d, yyyy"),
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<li className="flex flex-col gap-3 border-border border-b py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4">
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="font-serif text-foreground">{booking.title}</span>
					<Badge tone={STATUS_TONE[booking.status]} variant="outline">
						{STATUS_LABEL[booking.status]}
					</Badge>
				</div>
				{meta && <p className="docket mt-1 text-thread-ink">{meta}</p>}
			</div>

			{booking.packagePriceCents !== null && (
				<span className="docket-num shrink-0 text-foreground text-sm">
					{formatCents(booking.packagePriceCents)}
				</span>
			)}

			{booking.status !== "cancelled" && (
				<div className="flex shrink-0 items-center gap-2">
					{booking.status === "pending" && (
						<Button
							size="sm"
							disabled={isBusy}
							onClick={() => onConfirm(booking.uuid)}
						>
							<CheckIcon className="size-4" />
							Confirm
						</Button>
					)}
					<Button
						tone="secondary"
						variant="ghost"
						size="sm"
						disabled={isBusy}
						onClick={() => onCancel(booking.uuid)}
					>
						<XIcon className="size-4" />
						{booking.status === "pending" ? "Decline" : "Cancel"}
					</Button>
				</div>
			)}
		</li>
	);
}
