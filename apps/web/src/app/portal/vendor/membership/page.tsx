"use client";

import { type SubscriptionTier, TIER_LIMITS } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { format } from "date-fns";
import { CheckIcon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
	useOpenBillingPortal,
	useStartCheckout,
	useSubscription,
} from "../../../../api/billing.api";
import { AppBreadcrumb } from "../../../../components/app-breadcrumb";
import Loader from "../../../../components/loader";

const TIER_LABEL: Record<SubscriptionTier, string> = {
	free: "Free",
	pro: "Pro",
};

function planFeatures(tier: SubscriptionTier): string[] {
	const limits = TIER_LIMITS[tier];
	return [
		`${limits.maxServices} service${limits.maxServices === 1 ? "" : "s"}`,
		`${limits.maxPortfolioImagesPerService} portfolio images per service`,
		limits.priorityMatching
			? "Priority placement in couple matches"
			: "Standard placement in couple matches",
	];
}

function PlanCard({
	tier,
	isCurrent,
	action,
}: {
	tier: SubscriptionTier;
	isCurrent: boolean;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col border border-border p-6">
			<div className="flex items-center justify-between gap-2">
				<h2 className="font-serif text-foreground text-xl">
					{TIER_LABEL[tier]}
				</h2>
				{isCurrent && (
					<Badge tone="info" variant="outline">
						Current plan
					</Badge>
				)}
			</div>
			<ul className="mt-4 flex flex-1 flex-col gap-2">
				{planFeatures(tier).map((feature) => (
					<li key={feature} className="flex items-start gap-2 text-sm">
						<CheckIcon
							className="mt-0.5 size-4 shrink-0 text-thread-ink"
							strokeWidth={1.75}
						/>
						<span className="text-foreground">{feature}</span>
					</li>
				))}
			</ul>
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}

export default function MembershipPage() {
	const subscription = useSubscription();
	const checkout = useStartCheckout();
	const portal = useOpenBillingPortal();

	// Surface the outcome of a Stripe Checkout return, then tidy the URL.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const outcome = params.get("checkout");
		if (outcome === "success") {
			toast.success("You're on Pro — thanks for subscribing!");
		} else if (outcome === "cancelled") {
			toast.info("Checkout cancelled — no changes made.");
		}
		if (outcome) {
			window.history.replaceState(null, "", window.location.pathname);
		}
	}, []);

	const tier = subscription.data?.tier ?? "free";
	const status = subscription.data?.status ?? null;
	const renewsAt = subscription.data?.currentPeriodEnd ?? null;
	const isPro = tier === "pro";

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Your plan</span>
					<h1 className="mt-2 font-medium font-serif text-3xl text-foreground sm:text-4xl">
						Membership
					</h1>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Upgrade to Pro for more services, a larger portfolio, and priority
						placement in couples' matches.
					</p>
				</header>

				{subscription.isLoading ? (
					<div className="mt-6">
						<Loader />
					</div>
				) : subscription.error ? (
					<p className="mt-6 text-destructive-foreground text-sm">
						{subscription.error.message}
					</p>
				) : (
					<div className="rise-in mt-6">
						{isPro && (
							<p className="docket mb-4 text-muted-foreground">
								{status === "past_due"
									? "Payment past due — update your card to keep Pro."
									: renewsAt
										? `Renews ${format(renewsAt, "MMMM d, yyyy")}`
										: "Active"}
							</p>
						)}
						<div className="@container">
							<div className="grid @xl:grid-cols-2 grid-cols-1 gap-6">
								<PlanCard
									tier="free"
									isCurrent={!isPro}
									action={
										isPro ? (
											<Button
												tone="secondary"
												variant="outline"
												disabled={portal.isPending}
												onClick={() => portal.mutate({})}
											>
												Manage billing
											</Button>
										) : undefined
									}
								/>
								<PlanCard
									tier="pro"
									isCurrent={isPro}
									action={
										isPro ? (
											<Button
												tone="secondary"
												variant="outline"
												disabled={portal.isPending}
												onClick={() => portal.mutate({})}
											>
												Manage billing
											</Button>
										) : (
											<Button
												disabled={checkout.isPending}
												onClick={() => checkout.mutate({})}
											>
												Upgrade to Pro
											</Button>
										)
									}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
