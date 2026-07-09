import type { VendorCardSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";
import { formatCents } from "../vendor/price";
import { SaveVendorButton } from "../vendor/save-vendor-button";
import { VendorRating } from "../vendor/vendor-rating";
import { VendorThumb } from "../vendor/vendor-thumb";

export function VendorRow({ vendor }: { vendor: VendorCardSchema }) {
	const location = [vendor.city, vendor.region].filter(Boolean).join(", ");
	const meta = [vendor.featuredService?.categoryName, location]
		.filter(Boolean)
		.join(" · ");

	return (
		<li className="flex items-start gap-5 border-border border-b py-6 first:pt-0">
			<Link
				href={`/portal/discover/${vendor.uuid}`}
				className="flex min-w-0 flex-1 items-start gap-5"
			>
				<VendorThumb
					logoUrl={vendor.logoUrl}
					name={vendor.businessName}
					categoryName={vendor.featuredService?.categoryName ?? null}
					className="size-16"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 className="font-serif text-foreground text-lg">
							{vendor.businessName}
						</h3>
						{vendor.isVerified && (
							<Badge tone="success" variant="outline">
								Verified
							</Badge>
						)}
					</div>
					{meta && <p className="docket mt-1 text-thread-ink">{meta}</p>}
					{vendor.tagline && (
						<p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
							{vendor.tagline}
						</p>
					)}
					<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
						<VendorRating rating={vendor.rating} />
						{vendor.fromPriceCents !== null && (
							<span className="docket text-muted-foreground">
								from{" "}
								<span className="docket-num text-foreground">
									{formatCents(vendor.fromPriceCents)}
								</span>
							</span>
						)}
					</div>
				</div>
			</Link>
			<div className="shrink-0 pt-1">
				<SaveVendorButton vendorUuid={vendor.uuid} isSaved={vendor.isSaved} />
			</div>
		</li>
	);
}
