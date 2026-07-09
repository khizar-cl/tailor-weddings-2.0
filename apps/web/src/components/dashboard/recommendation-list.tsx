import type { WeddingSummarySchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import {
	Building2,
	Cake,
	Camera,
	ClipboardList,
	Flower2,
	type LucideIcon,
	Music,
	Sparkles,
	Utensils,
	Video,
} from "lucide-react";
import { PanelHeader } from "./panel-header";

// TODO: Move these to database
function categoryIcon(name: string | null): LucideIcon {
	const n = (name ?? "").toLowerCase();
	if (n.includes("photo")) return Camera;
	if (n.includes("video") || n.includes("film")) return Video;
	if (n.includes("floral") || n.includes("flower")) return Flower2;
	if (n.includes("cater")) return Utensils;
	if (n.includes("music") || n.includes("dj") || n.includes("band"))
		return Music;
	if (n.includes("venue")) return Building2;
	if (n.includes("cake") || n.includes("dessert")) return Cake;
	if (n.includes("plan")) return ClipboardList;
	return Sparkles;
}

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
								className="flex items-start gap-3 border-border border-b py-4 last:border-0"
							>
								<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border text-thread-ink">
									<Icon className="size-4" strokeWidth={1.75} />
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
										<h3 className="text-sm">{rec.businessName}</h3>
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
								{rec.matchScore !== null && (
									<div className="flex shrink-0 flex-col items-end">
										<span className="docket-num text-base text-foreground">
											{rec.matchScore}
										</span>
										<span className="docket">match</span>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
