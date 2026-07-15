"use client";

import { useBusinessReviews } from "../../api/review.api";
import { ReviewCard } from "./review-card";

/** Self-fetching published reviews for a business (detail page + reviews-received). */
export function VendorReviews({
	vendorBusinessUuid,
	heading = "Reviews",
}: {
	vendorBusinessUuid: string;
	heading?: string;
}) {
	const reviews = useBusinessReviews({ vendorBusinessUuid });
	const items = reviews.data?.items ?? [];

	return (
		<section>
			<div className="flex items-baseline justify-between gap-2">
				<h2 className="text-xl">{heading}</h2>
				{items.length > 0 && (
					<span className="docket-num text-muted-foreground text-sm">
						{items.length}
					</span>
				)}
			</div>
			{reviews.isLoading ? (
				<p className="docket mt-4 text-muted-foreground">Loading reviews…</p>
			) : reviews.error ? (
				<p className="mt-4 text-destructive-foreground text-sm">
					{reviews.error.message}
				</p>
			) : items.length === 0 ? (
				<p className="docket mt-4 text-muted-foreground">No reviews yet.</p>
			) : (
				<ul className="mt-2">
					{items.map((review) => (
						<ReviewCard key={review.uuid} review={review} />
					))}
				</ul>
			)}
		</section>
	);
}
