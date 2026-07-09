import type { VendorRatingSchema } from "@repo/shared";
import { StarIcon } from "lucide-react";

export function VendorRating({ rating }: { rating: VendorRatingSchema }) {
	if (rating.count === 0) {
		return <span className="docket text-muted-foreground">No reviews yet</span>;
	}
	return (
		<span className="inline-flex items-center gap-1">
			<StarIcon className="size-3.5 fill-current text-thread-ink" />
			<span className="docket-num text-foreground">{rating.average}</span>
			<span className="docket text-muted-foreground">({rating.count})</span>
		</span>
	);
}
