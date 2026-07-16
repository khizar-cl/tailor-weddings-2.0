import { StarIcon } from "lucide-react";
import Link from "next/link";
import { PanelHeader } from "../dashboard/panel-header";

export function ReputationPanel({
	reviewCount,
	averageRating,
	pendingReviewCount,
}: {
	reviewCount: number;
	averageRating: number;
	pendingReviewCount: number;
}) {
	return (
		<section>
			<PanelHeader
				title="Reputation"
				trailing={
					reviewCount > 0 ? (
						<span className="inline-flex items-center gap-1">
							<StarIcon className="size-3.5 fill-current text-thread-ink" />
							<span className="docket-num text-foreground text-sm">
								{averageRating.toFixed(1)}
							</span>
						</span>
					) : undefined
				}
			/>
			<p className="mt-4 text-muted-foreground text-sm">
				{reviewCount > 0
					? `${reviewCount} verified ${reviewCount === 1 ? "review" : "reviews"} from couples and peers.`
					: "No reviews yet — they arrive after the weddings you've worked."}
			</p>
			{pendingReviewCount > 0 && (
				<p className="mt-3 text-foreground text-sm">
					You have {pendingReviewCount}{" "}
					{pendingReviewCount === 1 ? "endorsement" : "endorsements"} to write.
				</p>
			)}
			<Link
				href="/portal/vendor/reviews"
				className="mt-4 inline-flex items-center text-primary text-sm hover:underline"
			>
				{pendingReviewCount > 0 ? "Review collaborators →" : "View reviews →"}
			</Link>
		</section>
	);
}
