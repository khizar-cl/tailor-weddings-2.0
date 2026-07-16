"use client";

import type {
	BookingSchema,
	SubscriptionTier,
	VendorProfileSchema,
} from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useSubscription } from "../../../api/billing.api";
import { useVendorBookingRequests } from "../../../api/booking.api";
import {
	useBusinessReviews,
	useMyReviewRequests,
} from "../../../api/review.api";
import { useVendorProfile } from "../../../api/vendor-profile.api";
import type { ReadinessStep } from "../../../components/vendor-dashboard/listing-readiness-panel";
import { ListingReadinessPanel } from "../../../components/vendor-dashboard/listing-readiness-panel";
import { PlanNudge } from "../../../components/vendor-dashboard/plan-nudge";
import { ReputationPanel } from "../../../components/vendor-dashboard/reputation-panel";
import { RequestsPanel } from "../../../components/vendor-dashboard/requests-panel";
import { VendorMasthead } from "../../../components/vendor-dashboard/vendor-masthead";
import { useAuth } from "../../../hooks/use-auth";

// Pending first (they need action), then booked, then cancelled.
const STATUS_ORDER: Record<BookingSchema["status"], number> = {
	pending: 0,
	confirmed: 1,
	cancelled: 2,
};

function DashboardSkeleton() {
	return (
		<div className="flex flex-col gap-10">
			<Skeleton className="h-28 w-full" />
			<div className="grid gap-8 md:grid-cols-5 md:gap-10">
				<Skeleton className="h-80 w-full md:col-span-3" />
				<Skeleton className="h-80 w-full md:col-span-2" />
			</div>
		</div>
	);
}

export default function VendorDashboard() {
	const { user } = useAuth();
	const firstName = user?.name?.trim().split(" ")[0] || "there";

	const profile = useVendorProfile();
	const requests = useVendorBookingRequests();
	const subscription = useSubscription();
	const reviewRequests = useMyReviewRequests();
	const businessUuid = profile.data?.uuid;
	const reviews = useBusinessReviews(
		{ vendorBusinessUuid: businessUuid ?? "" },
		{ enabled: Boolean(businessUuid) },
	);

	const isLoading = profile.isLoading || requests.isLoading;
	const error = profile.error ?? requests.error;

	const data = profile.data;
	const sortedRequests = [...(requests.data?.items ?? [])].sort(
		(a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
	);
	const pendingCount = sortedRequests.filter(
		(b) => b.status === "pending",
	).length;

	const reviewItems = reviews.data?.items ?? [];
	const averageRating =
		reviewItems.length > 0
			? reviewItems.reduce((sum, r) => sum + r.overallRating, 0) /
				reviewItems.length
			: 0;

	return (
		<div className="min-h-screen bg-background p-6">
			{isLoading ? (
				<DashboardSkeleton />
			) : error ? (
				<p className="text-destructive-foreground text-sm">{error.message}</p>
			) : data ? (
				<VendorDashboardContent
					firstName={firstName}
					location={[data.city, data.region].filter(Boolean).join(", ")}
					businessName={data.businessName}
					isVerified={data.isVerified}
					tier={data.tier}
					services={data.services}
					hasLogo={data.logoUrl !== null}
					hasBio={Boolean(data.bio)}
					requests={sortedRequests}
					pendingCount={pendingCount}
					reviewCount={reviewItems.length}
					averageRating={averageRating}
					pendingReviewCount={reviewRequests.data?.items.length ?? 0}
					renewsAt={subscription.data?.currentPeriodEnd ?? null}
				/>
			) : null}
		</div>
	);
}

function VendorDashboardContent({
	firstName,
	location,
	businessName,
	isVerified,
	tier,
	services,
	hasLogo,
	hasBio,
	requests,
	pendingCount,
	reviewCount,
	averageRating,
	pendingReviewCount,
	renewsAt,
}: {
	firstName: string;
	location: string;
	businessName: string;
	isVerified: boolean;
	tier: SubscriptionTier;
	services: VendorProfileSchema["services"];
	hasLogo: boolean;
	hasBio: boolean;
	requests: BookingSchema[];
	pendingCount: number;
	reviewCount: number;
	averageRating: number;
	pendingReviewCount: number;
	renewsAt: Date | null;
}) {
	const publishedCount = services.filter((s) => s.isPublished).length;
	const hasPortfolio = services.some((s) => s.portfolio.length > 0);

	const readinessSteps: ReadinessStep[] = [
		{
			label: "Add your studio bio",
			done: hasBio,
			href: "/portal/vendor/profile",
		},
		{ label: "Upload a logo", done: hasLogo, href: "/portal/vendor/profile" },
		{
			label: "Publish a service",
			done: publishedCount > 0,
			href: "/portal/vendor/profile",
		},
		{
			label: "Add portfolio images",
			done: hasPortfolio,
			href: "/portal/vendor/profile",
		},
	];

	return (
		<div className="@container rise-in flex flex-col gap-10">
			<VendorMasthead
				firstName={firstName}
				businessName={businessName}
				location={location}
				isVerified={isVerified}
				liveServices={publishedCount}
				totalServices={services.length}
				tier={tier}
				pendingRequests={pendingCount}
			/>
			<div className="grid @3xl:grid-cols-5 @3xl:gap-10 gap-8">
				<div className="@3xl:col-span-3">
					<RequestsPanel requests={requests} pendingCount={pendingCount} />
				</div>
				<div className="@3xl:col-span-2 flex flex-col gap-8">
					<ListingReadinessPanel steps={readinessSteps} />
					<hr className="stitch-rule" />
					<ReputationPanel
						reviewCount={reviewCount}
						averageRating={averageRating}
						pendingReviewCount={pendingReviewCount}
					/>
					<hr className="stitch-rule" />
					<PlanNudge tier={tier} renewsAt={renewsAt} />
				</div>
			</div>
		</div>
	);
}
