import { cn } from "@repo/ui/lib/utils";
import { categoryIcon } from "./category-icon";

interface VendorThumbProps {
	logoUrl: string | null;
	name: string;
	categoryName: string | null;
	className?: string;
	/** Contain (padded) rather than cover — better for a logo in a wide band. */
	contain?: boolean;
}

/** Logo swatch, falling back to the category glyph when there's no logo. */
export function VendorThumb({
	logoUrl,
	name,
	categoryName,
	className,
	contain = false,
}: VendorThumbProps) {
	const Icon = categoryIcon(categoryName);
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden border border-border bg-secondary",
				className,
			)}
		>
			{logoUrl ? (
				// biome-ignore lint/performance/noImgElement: presigned S3 URL has a dynamic host/expiry, unsuited to next/image
				<img
					src={logoUrl}
					alt={name}
					className={cn(
						"h-full w-full",
						contain ? "object-contain p-6" : "object-cover",
					)}
					loading="lazy"
				/>
			) : (
				<Icon className="size-6 text-thread-ink" strokeWidth={1.75} />
			)}
		</div>
	);
}
