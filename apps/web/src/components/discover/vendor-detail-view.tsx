import type { VendorDetailSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { formatPrice } from "../vendor/price";
import { SaveVendorButton } from "../vendor/save-vendor-button";
import { VendorRating } from "../vendor/vendor-rating";
import { VendorThumb } from "../vendor/vendor-thumb";
import { websiteHref } from "../vendor/website";
import { PortfolioCollage } from "./portfolio-collage";

function Fact({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="border-border border-b py-3 last:border-0">
			<dt className="docket text-muted-foreground">{label}</dt>
			<dd className="mt-1 text-foreground text-sm">{children}</dd>
		</div>
	);
}

export function VendorDetailView({ vendor }: { vendor: VendorDetailSchema }) {
	const location = [vendor.city, vendor.region].filter(Boolean).join(", ");
	const leadCategory = vendor.services[0]?.categoryName ?? "Vendor";

	return (
		<div className="@container rise-in">
			<header className="border-border border-b pb-8">
				<span className="docket text-thread-ink">{leadCategory}</span>
				<div className="mt-2 flex flex-wrap items-start justify-between gap-4">
					<div className="flex min-w-0 items-start gap-4">
						<VendorThumb
							logoUrl={vendor.logoUrl}
							name={vendor.businessName}
							categoryName={leadCategory}
							className="size-20"
						/>
						<div className="min-w-0">
							<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
								{vendor.businessName}
							</h1>
							{vendor.tagline && (
								<p className="mt-2 max-w-xl text-muted-foreground text-sm">
									{vendor.tagline}
								</p>
							)}
							<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
								{vendor.isVerified && (
									<Badge tone="success" variant="outline">
										Verified
									</Badge>
								)}
								<VendorRating rating={vendor.rating} />
							</div>
						</div>
					</div>
					<SaveVendorButton
						vendorUuid={vendor.uuid}
						isSaved={vendor.isSaved}
						variant="full"
					/>
				</div>
			</header>

			<div className="mt-8 grid @3xl:grid-cols-[minmax(0,1fr)_16rem] gap-10">
				<div className="flex flex-col gap-10">
					{vendor.bio && (
						<section>
							<h2 className="text-xl">About</h2>
							<p className="mt-3 whitespace-pre-line text-foreground text-sm leading-relaxed">
								{vendor.bio}
							</p>
						</section>
					)}

					<section>
						<h2 className="text-xl">Services</h2>
						{vendor.services.length === 0 ? (
							<p className="docket mt-4 text-muted-foreground">
								No published services yet.
							</p>
						) : (
							<div className="mt-2">
								{vendor.services.map((service) => (
									<section
										key={service.uuid}
										className="border-border border-b py-6 last:border-0"
									>
										<div className="flex flex-wrap items-baseline justify-between gap-2">
											<h3 className="font-serif text-foreground text-lg">
												{service.categoryName}
											</h3>
											{service.startingPriceCents !== null && (
												<span className="docket text-muted-foreground">
													from{" "}
													<span className="docket-num text-foreground">
														{formatPrice(
															service.startingPriceCents,
															service.priceUnit,
														)}
													</span>
												</span>
											)}
										</div>
										{service.description && (
											<p className="mt-2 text-muted-foreground text-sm">
												{service.description}
											</p>
										)}

										<div className="mt-4">
											<PortfolioCollage images={service.portfolio} />
										</div>

										{service.packages.length > 0 && (
											<ul className="mt-4 flex flex-col gap-3">
												{service.packages.map((pkg) => (
													<li
														key={pkg.uuid}
														className="flex items-baseline justify-between gap-4 border-border border-t pt-3"
													>
														<div className="min-w-0">
															<p className="text-foreground text-sm">
																{pkg.name}
															</p>
															{pkg.description && (
																<p className="mt-0.5 text-muted-foreground text-xs">
																	{pkg.description}
																</p>
															)}
														</div>
														<span className="docket-num shrink-0 text-foreground text-sm">
															{formatPrice(pkg.priceCents, pkg.priceUnit)}
														</span>
													</li>
												))}
											</ul>
										)}
									</section>
								))}
							</div>
						)}
					</section>
				</div>

				<aside className="@3xl:sticky @3xl:top-20 @3xl:self-start">
					<h2 className="border-border border-b pb-3 text-base">Details</h2>
					<dl className="mt-2">
						{location && <Fact label="Location">{location}</Fact>}
						{vendor.yearsInBusiness !== null && (
							<Fact label="Experience">
								<span className="docket-num">{vendor.yearsInBusiness}</span>{" "}
								years
							</Fact>
						)}
						<Fact label="Rating">
							<VendorRating rating={vendor.rating} />
						</Fact>
						{vendor.peerEndorsementCount > 0 && (
							<Fact label="Peer endorsements">
								<span className="docket-num">
									{vendor.peerEndorsementCount}
								</span>
							</Fact>
						)}
						{vendor.website && (
							<Fact label="Website">
								<a
									href={websiteHref(vendor.website)}
									target="_blank"
									rel="noreferrer"
									className="text-primary hover:underline"
								>
									{vendor.website.replace(/^https?:\/\//, "")}
								</a>
							</Fact>
						)}
					</dl>
				</aside>
			</div>
		</div>
	);
}
