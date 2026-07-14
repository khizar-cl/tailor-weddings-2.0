"use client";

import type { BookingSchema } from "@repo/shared";
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
						<AlertDialog>
							<AlertDialogTrigger
								render={<Button size="sm" disabled={isBusy} />}
							>
								<CheckIcon className="size-4" />
								Confirm
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Confirm this booking?</AlertDialogTitle>
									<AlertDialogDescription>
										{`This books ${booking.title}${
											booking.packageName ? ` for ${booking.packageName}` : ""
										} and adds a line to their budget.`}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Not yet</AlertDialogCancel>
									<AlertDialogAction
										tone="primary"
										onClick={() => onConfirm(booking.uuid)}
									>
										Confirm booking
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button
									tone="secondary"
									variant="ghost"
									size="sm"
									disabled={isBusy}
								/>
							}
						>
							<XIcon className="size-4" />
							{booking.status === "pending" ? "Decline" : "Cancel"}
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									{booking.status === "pending"
										? "Decline this request?"
										: "Cancel this booking?"}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{booking.status === "pending"
										? `This declines ${booking.title}'s booking request.`
										: `This cancels your booking with ${booking.title} and removes it from their budget.`}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Keep it</AlertDialogCancel>
								<AlertDialogAction onClick={() => onCancel(booking.uuid)}>
									{booking.status === "pending" ? "Decline" : "Cancel booking"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			)}
		</li>
	);
}
