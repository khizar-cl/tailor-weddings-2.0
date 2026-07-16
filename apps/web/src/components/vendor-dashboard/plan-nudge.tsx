import { type SubscriptionTier, TIER_LIMITS } from "@repo/shared";
import { format } from "date-fns";
import Link from "next/link";
import { PanelHeader } from "../dashboard/panel-header";

export function PlanNudge({
	tier,
	renewsAt,
}: {
	tier: SubscriptionTier;
	renewsAt: Date | null;
}) {
	const isPro = tier === "pro";
	const limits = TIER_LIMITS.free;

	return (
		<section>
			<PanelHeader title="Membership" />
			<p className="mt-4 text-muted-foreground text-sm">
				{isPro
					? renewsAt
						? `Pro — renews ${format(renewsAt, "MMM d, yyyy")}.`
						: "You're on Pro, with priority placement in couples' matches."
					: `Free — up to ${limits.maxServices} service and ${limits.maxPortfolioImagesPerService} portfolio images. Upgrade for more and priority placement.`}
			</p>
			<Link
				href="/portal/vendor/membership"
				className="mt-4 inline-flex items-center text-primary text-sm hover:underline"
			>
				{isPro ? "Manage billing →" : "Upgrade to Pro →"}
			</Link>
		</section>
	);
}
