"use client";

import { useVendorProfile } from "../../../../api/vendor-profile.api";
import { AppBreadcrumb } from "../../../../components/app-breadcrumb";
import Loader from "../../../../components/loader";
import { PendingReviews } from "../../../../components/reviews/pending-reviews";
import { VendorReviews } from "../../../../components/reviews/vendor-reviews";

export default function VendorReviewsPage() {
	const profile = useVendorProfile();

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Your reputation</span>
					<h1 className="mt-2 font-medium font-serif text-3xl text-foreground sm:text-4xl">
						Reviews
					</h1>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Endorse the vendors you worked alongside, and see what couples and
						peers are saying about you.
					</p>
				</header>

				{profile.isLoading ? (
					<div className="mt-6">
						<Loader />
					</div>
				) : profile.error ? (
					<p className="mt-6 text-destructive-foreground text-sm">
						{profile.error.message}
					</p>
				) : profile.data ? (
					<div className="@container mt-6">
						<div className="grid @3xl:grid-cols-2 grid-cols-1 gap-10">
							<PendingReviews
								type="peer"
								title="Review a collaborator"
								description="Vendors you were co-booked with. Peer endorsements build trust."
							/>
							<VendorReviews
								vendorBusinessUuid={profile.data.uuid}
								heading="Reviews received"
							/>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
