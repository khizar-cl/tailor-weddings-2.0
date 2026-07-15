"use client";

import type { ReviewType } from "@repo/shared";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import { useMyReviewRequests } from "../../api/review.api";
import { ReviewFormDialog } from "./review-form-dialog";

/**
 * The caller's open review prompts of a given kind. `hideWhenEmpty` keeps it
 * out of the way on shared surfaces (the team page) when there's nothing to do.
 */
export function PendingReviews({
	type,
	title,
	description,
	hideWhenEmpty = false,
	className,
}: {
	type: ReviewType;
	title: string;
	description?: string;
	hideWhenEmpty?: boolean;
	className?: string;
}) {
	const requests = useMyReviewRequests();
	const items = (requests.data?.items ?? []).filter((r) => r.type === type);

	if (hideWhenEmpty && items.length === 0) return null;

	return (
		<section className={cn(className)}>
			<h2 className="text-base">{title}</h2>
			{description && (
				<p className="mt-1 text-muted-foreground text-sm">{description}</p>
			)}
			{items.length === 0 ? (
				<p className="docket mt-4 text-muted-foreground">
					Nothing to review right now.
				</p>
			) : (
				<ul className="mt-2">
					{items.map((request) => (
						<li
							key={request.uuid}
							className="flex flex-wrap items-center gap-3 border-border border-b py-4 last:border-0"
						>
							<div className="min-w-0 flex-1">
								<p className="font-serif text-foreground">
									{request.subjectBusinessName}
								</p>
								{request.weddingDate && (
									<p className="docket mt-1 text-thread-ink">
										{format(request.weddingDate, "MMMM d, yyyy")}
									</p>
								)}
							</div>
							<ReviewFormDialog request={request} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
