"use client";

import type { BookingSchema } from "@repo/shared";
import {
	useCancelBooking,
	useConfirmBooking,
	useVendorBookingRequests,
} from "../../../../api/booking.api";
import { AppBreadcrumb } from "../../../../components/app-breadcrumb";
import { BookingRequestRow } from "../../../../components/booking/booking-request-row";
import Loader from "../../../../components/loader";

const STATUS_ORDER: Record<BookingSchema["status"], number> = {
	pending: 0,
	confirmed: 1,
	cancelled: 2,
};

export default function VendorBookingsPage() {
	const requests = useVendorBookingRequests();
	const confirm = useConfirmBooking();
	const cancel = useCancelBooking();
	const isBusy = confirm.isPending || cancel.isPending;

	// Pending first (they need action), then booked, then cancelled.
	const items = [...(requests.data?.items ?? [])].sort(
		(a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
	);
	const pendingCount = items.filter((b) => b.status === "pending").length;

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Your bookings</span>
					<div className="mt-2 flex items-end justify-between gap-4">
						<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
							Requests
						</h1>
						{pendingCount > 0 && (
							<span className="docket-num text-muted-foreground text-sm">
								{pendingCount} awaiting you
							</span>
						)}
					</div>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Couples requesting your services. Confirm to add it to their budget,
						or decline to pass.
					</p>
				</header>

				{requests.isLoading ? (
					<div className="mt-6">
						<Loader />
					</div>
				) : requests.error ? (
					<p className="mt-6 text-destructive-foreground text-sm">
						{requests.error.message}
					</p>
				) : items.length === 0 ? (
					<div className="mt-6 border border-border border-dashed p-8 text-center">
						<p className="text-muted-foreground text-sm">
							No booking requests yet.
						</p>
					</div>
				) : (
					<ul className="mt-2">
						{items.map((booking) => (
							<BookingRequestRow
								key={booking.uuid}
								booking={booking}
								isBusy={isBusy}
								onConfirm={(bookingUuid) => confirm.mutate({ bookingUuid })}
								onCancel={(bookingUuid) => cancel.mutate({ bookingUuid })}
							/>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
