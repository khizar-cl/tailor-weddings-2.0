"use client";

import type { BookingSchema, VendorPackageSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { CalendarPlusIcon, ChevronDownIcon, XIcon } from "lucide-react";
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

	const isActive = booking !== null && booking.status !== "cancelled";
	if (isActive && booking) {
		const isConfirmed = booking.status === "confirmed";
		return (
			<div className="flex items-center gap-2">
				<Badge tone={isConfirmed ? "success" : "info"} variant="outline">
					{isConfirmed ? "Booked" : "Requested"}
				</Badge>
				<Button
					tone="secondary"
					variant="ghost"
					size="sm"
					disabled={isBusy}
					onClick={() => cancel.mutate({ bookingUuid: booking.uuid })}
				>
					<XIcon className="size-4" />
					Cancel
				</Button>
			</div>
		);
	}

	const requestFor = (servicePackageUuid?: string) =>
		request.mutate({ vendorServiceUuid, servicePackageUuid });

	if (packages.length === 0) {
		return (
			<Button disabled={isBusy} onClick={() => requestFor()}>
				<CalendarPlusIcon className="size-4" />
				Request to book
			</Button>
		);
	}

	return (
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
					<DropdownMenuItem key={pkg.uuid} onClick={() => requestFor(pkg.uuid)}>
						<span className="min-w-0 truncate">{pkg.name}</span>
						<span className="docket-num ml-auto text-muted-foreground">
							{formatPrice(pkg.priceCents, pkg.priceUnit)}
						</span>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => requestFor()}>
					Request without a package
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
