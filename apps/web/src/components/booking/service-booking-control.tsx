"use client";

import type { BookingSchema, VendorPackageSchema } from "@repo/shared";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { CalendarPlusIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useCancelBooking, useRequestBooking } from "../../api/booking.api";
import { formatPrice } from "../vendor/price";

interface ServiceBookingControlProps {
	vendorServiceUuid: string;
	packages: VendorPackageSchema[];
	/** The couple's booking for this service, if any (may be cancelled). */
	booking: BookingSchema | null;
}

export function ServiceBookingControl({
	vendorServiceUuid,
	packages,
	booking,
}: ServiceBookingControlProps) {
	const request = useRequestBooking();
	const cancel = useCancelBooking();
	const isBusy = request.isPending || cancel.isPending;
	const [pendingPackage, setPendingPackage] =
		useState<VendorPackageSchema | null>(null);

	const isActive = booking !== null && booking.status !== "cancelled";
	if (isActive && booking) {
		const isConfirmed = booking.status === "confirmed";
		return (
			<div className="flex items-center gap-2">
				<Badge tone={isConfirmed ? "success" : "info"} variant="outline">
					{isConfirmed ? "Booked" : "Requested"}
				</Badge>
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
						Cancel
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{isConfirmed
									? "Cancel this booking?"
									: "Withdraw this request?"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{isConfirmed
									? `This cancels your booking with ${booking.title} and removes its line from your budget.`
									: `This withdraws your booking request with ${booking.title}.`}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Keep it</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => cancel.mutate({ bookingUuid: booking.uuid })}
							>
								{isConfirmed ? "Cancel booking" : "Withdraw request"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		);
	}

	// Couples book a specific package. A published service always has at least
	// one, but guard defensively.
	if (packages.length === 0) {
		return null;
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<Button disabled={isBusy} className="gap-2" />}
				>
					<CalendarPlusIcon className="size-4" />
					Request to book
					<ChevronDownIcon className="size-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-64">
					{packages.map((pkg) => (
						<DropdownMenuItem
							key={pkg.uuid}
							onClick={() => setPendingPackage(pkg)}
						>
							<span className="min-w-0 truncate">{pkg.name}</span>
							<span className="docket-num ml-auto text-muted-foreground">
								{formatPrice(pkg.priceCents, pkg.priceUnit)}
							</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				open={pendingPackage !== null}
				onOpenChange={(open) => !open && setPendingPackage(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Request to book this package?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingPackage &&
								`We'll send the vendor a request for ${pendingPackage.name} (${formatPrice(
									pendingPackage.priceCents,
									pendingPackage.priceUnit,
								)}). They confirm before it's booked.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							tone="primary"
							onClick={() => {
								if (pendingPackage) {
									request.mutate({
										vendorServiceUuid,
										servicePackageUuid: pendingPackage.uuid,
									});
								}
							}}
						>
							Send request
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
