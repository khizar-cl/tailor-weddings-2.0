import type { VendorCardSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";
import { formatCents } from "../vendor/price";
import { SaveVendorButton } from "../vendor/save-vendor-button";
import { VendorRating } from "../vendor/vendor-rating";
import { VendorThumb } from "../vendor/vendor-thumb";

export function VendorCard({ vendor }: { vendor: VendorCardSchema }) {
	const location = [vendor.city, vendor.region].filter(Boolean).join(", ");
	const meta = [vendor.featuredService?.categoryName, location]
		.filter(Boolean)
		.join(" · ");

	return (
		<li className="group relative flex flex-col border border-border">
			<Link
				href={`/portal/discover/${vendor.uuid}`}
				className="flex min-w-0 flex-1 flex-col"
			>
				<VendorThumb
					logoUrl={vendor.logoUrl}
					name={vendor.businessName}
					categoryName={vendor.featuredService?.categoryName ?? null}
					className="aspect-4/5 w-full border-0 border-border border-b"
				/>
				<div className="flex flex-1 flex-col p-4">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 className="font-serif text-foreground text-lg group-hover:underline">
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
					<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
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
			<div className="absolute top-2 right-2">
				<SaveVendorButton vendorUuid={vendor.uuid} isSaved={vendor.isSaved} />
			</div>
		</li>
	);
}
