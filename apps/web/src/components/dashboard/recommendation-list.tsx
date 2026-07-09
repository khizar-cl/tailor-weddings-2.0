import type { WeddingSummarySchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";
import { categoryIcon } from "../vendor/category-icon";
import { PanelHeader } from "./panel-header";

export function RecommendationList({
	recommendations,
}: {
	recommendations: WeddingSummarySchema["recommendations"];
}) {
	return (
		<section>
			<PanelHeader title="Measured for you" />
			{recommendations.length === 0 ? (
				<p className="docket mt-6">
					No matches yet — we're tailoring vendors to your day.
				</p>
			) : (
				<ul className="mt-1">
					{recommendations.map((rec) => {
						const Icon = categoryIcon(rec.categoryName);
						const meta = [rec.categoryName, rec.region]
							.filter(Boolean)
							.join(" · ");
						return (
							<li
								key={rec.uuid}
								className="border-border border-b last:border-0"
							>
								<Link
									href={`/portal/discover/${rec.vendorBusinessUuid}`}
									className="group flex items-start gap-3 py-4"
								>
									<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border text-thread-ink">
										<Icon className="size-4" strokeWidth={1.75} />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
											<h3 className="text-sm group-hover:underline">
												{rec.businessName}
											</h3>
											{rec.isVerified && (
												<Badge tone="success" variant="outline">
													Verified
												</Badge>
											)}
										</div>
										{meta && <p className="docket mt-0.5">{meta}</p>}
										{rec.rationale && (
											<p className="mt-1 text-muted-foreground text-xs">
												{rec.rationale}
											</p>
										)}
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
