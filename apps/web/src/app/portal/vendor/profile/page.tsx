"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { useCategories } from "../../../../api/category.api";
import { useVendorProfile } from "../../../../api/vendor-profile.api";
import { AppBreadcrumb } from "../../../../components/app-breadcrumb";
import { websiteHref } from "../../../../components/vendor/website";
import { AddServiceForm } from "../../../../components/vendor-profile/add-service-form";
import { BusinessDetailsForm } from "../../../../components/vendor-profile/business-details-form";
import { LogoUploader } from "../../../../components/vendor-profile/logo-uploader";
import { ServiceCard } from "../../../../components/vendor-profile/service-card";

function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-72 w-full" />
			<Skeleton className="h-72 w-full" />
		</div>
	);
}

function ReadFact({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<dt className="docket text-muted-foreground">{label}</dt>
			<dd className="mt-1 text-foreground text-sm">{children}</dd>
		</div>
	);
}

export default function VendorProfilePage() {
	const profile = useVendorProfile();
	const categories = useCategories();
	const [editingBusiness, setEditingBusiness] = useState(false);

	const data = profile.data;
	const offeredCategoryUuids = new Set(
		(data?.services ?? [])
			.map((s) => s.categoryUuid)
			.filter((uuid): uuid is string => uuid !== null),
	);
	const availableCategories = (categories.data?.categories ?? []).filter(
		(c) => !offeredCategoryUuids.has(c.uuid),
	);
	const publishedCount =
		data?.services.filter((s) => s.isPublished).length ?? 0;
	const location = data
		? [data.city, data.region].filter(Boolean).join(", ")
		: "";

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			{profile.isLoading ? (
				<ProfileSkeleton />
			) : profile.error ? (
				<p className="text-destructive-foreground text-sm">
					{profile.error.message}
				</p>
			) : data ? (
				<div className="rise-in flex flex-col gap-10">
					<header className="border-border border-b pb-8">
						<span className="docket text-thread-ink">Your studio</span>
						<div className="mt-3 flex flex-wrap items-start gap-6">
							<LogoUploader
								logoUrl={data.logoUrl}
								businessName={data.businessName}
							/>
							<div className="min-w-0 flex-1">
								<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
									{data.businessName}
								</h1>
								{data.tagline && (
									<p className="mt-2 max-w-xl text-muted-foreground text-sm">
										{data.tagline}
									</p>
								)}
								<div className="mt-3 flex flex-wrap items-center gap-2">
									{data.isVerified && (
										<Badge tone="success" variant="outline">
											Verified
										</Badge>
									)}
									<span className="docket-num text-muted-foreground text-sm">
										{publishedCount}/{data.services.length} live
									</span>
								</div>
								<p className="mt-2 text-muted-foreground text-sm">
									{publishedCount === 0
										? "Publish at least one service to appear in couples' discovery."
										: "Your published services are discoverable by couples."}
								</p>
							</div>
						</div>
					</header>

					<section>
						<div className="flex items-center justify-between border-border border-b pb-3">
							<h2 className="text-xl">Business details</h2>
							{!editingBusiness && (
								<Button
									tone="secondary"
									variant="ghost"
									size="icon-sm"
									aria-label="Edit business details"
									onClick={() => setEditingBusiness(true)}
								>
									<PencilIcon className="size-4" />
								</Button>
							)}
						</div>

						{editingBusiness ? (
							<div className="mt-4 max-w-2xl">
								<BusinessDetailsForm
									profile={data}
									onSaved={() => setEditingBusiness(false)}
									onCancel={() => setEditingBusiness(false)}
								/>
							</div>
						) : (
							<div className="mt-4 max-w-2xl">
								{data.bio ? (
									<p className="whitespace-pre-line text-foreground text-sm leading-relaxed">
										{data.bio}
									</p>
								) : (
									<p className="text-muted-foreground text-sm italic">
										Add an introduction so couples get to know your studio.
									</p>
								)}
								<dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
									<ReadFact label="Location">{location || "—"}</ReadFact>
									<ReadFact label="Website">
										{data.website ? (
											<a
												href={websiteHref(data.website)}
												target="_blank"
												rel="noreferrer"
												className="text-primary hover:underline"
											>
												{data.website.replace(/^https?:\/\//, "")}
											</a>
										) : (
											"—"
										)}
									</ReadFact>
									<ReadFact label="Experience">
										{data.yearsInBusiness !== null ? (
											<>
												<span className="docket-num">
													{data.yearsInBusiness}
												</span>{" "}
												years
											</>
										) : (
											"—"
										)}
									</ReadFact>
								</dl>
							</div>
						)}
					</section>

					<section>
						<div className="flex flex-wrap items-center justify-between gap-3 border-border border-b pb-3">
							<h2 className="text-xl">Services</h2>
							<AddServiceForm
								availableCategories={availableCategories}
								canAdd={data.services.length < data.limits.maxServices}
								maxServices={data.limits.maxServices}
							/>
						</div>
						{data.services.length === 0 ? (
							<p className="docket mt-6 text-muted-foreground">
								Add your first service to start building your listing.
							</p>
						) : (
							<div className="mt-6 flex flex-col gap-6">
								{data.services.map((service) => (
									<ServiceCard
										key={service.uuid}
										service={service}
										hasLogo={data.logoUrl !== null}
										maxPortfolioImages={
											data.limits.maxPortfolioImagesPerService
										}
									/>
								))}
							</div>
						)}
					</section>
				</div>
			) : null}
		</div>
	);
}
