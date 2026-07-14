"use client";

import type { BookingSchema } from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useWeddingBookings } from "../../../../api/booking.api";
import { useVendorDetail } from "../../../../api/vendor.api";
import { AppBreadcrumb } from "../../../../components/app-breadcrumb";
import { VendorDetailView } from "../../../../components/discover/vendor-detail-view";
import { useSetBreadcrumbLabel } from "../../../../providers/breadcrumb-provider";

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-3 border-border border-b pb-8">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-9 w-72" />
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_16rem]">
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		</div>
	);
}

export default function VendorDetailPage() {
	const params = useParams<{ uuid: string }>();
	const detail = useVendorDetail(params.uuid);
	const bookings = useWeddingBookings();

	useSetBreadcrumbLabel(detail.data?.businessName);

	const bookingByService = useMemo(() => {
		const map = new Map<string, BookingSchema>();
		for (const booking of bookings.data?.items ?? []) {
			map.set(booking.vendorServiceUuid, booking);
		}
		return map;
	}, [bookings.data]);

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			{detail.isLoading ? (
				<DetailSkeleton />
			) : detail.error ? (
				<p className="text-destructive-foreground text-sm">
					{detail.error.message}
				</p>
			) : detail.data ? (
				<VendorDetailView
					vendor={detail.data}
					bookingByService={bookingByService}
				/>
			) : null}
		</div>
	);
}
