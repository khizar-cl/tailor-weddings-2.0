import type { ReviewSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { format } from "date-fns";
import { ReviewStars } from "./review-stars";

export function ReviewCard({ review }: { review: ReviewSchema }) {
	return (
		<li className="border-border border-b py-5 last:border-0">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<span className="font-serif text-foreground">{review.authorName}</span>
				<Badge
					tone={review.type === "peer" ? "info" : "secondary"}
					variant="outline"
				>
					{review.type === "peer" ? "Vendor" : "Couple"}
				</Badge>
				<ReviewStars rating={review.overallRating} className="ml-auto" />
			</div>
			{review.body && (
				<p className="mt-2 whitespace-pre-line text-foreground text-sm leading-relaxed">
					{review.body}
				</p>
			)}
			{review.publishedAt && (
				<p className="docket mt-2 text-muted-foreground">
					{format(review.publishedAt, "MMMM yyyy")}
				</p>
			)}
		</li>
	);
}
