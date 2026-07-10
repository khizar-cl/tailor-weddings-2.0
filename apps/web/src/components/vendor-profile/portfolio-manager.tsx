import type { VendorProfileServiceSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { useRef } from "react";
import {
	useRemovePortfolio,
	useUploadPortfolio,
} from "../../api/vendor-profile.api";

export function PortfolioManager({
	service,
	maxImages,
}: {
	service: VendorProfileServiceSchema;
	maxImages: number;
}) {
	const upload = useUploadPortfolio();
	const remove = useRemovePortfolio();
	const inputRef = useRef<HTMLInputElement>(null);

	const count = service.portfolio.length;
	const atLimit = count >= maxImages;

	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			upload.mutate({ serviceUuid: service.uuid, file });
		}
		// Reset so selecting the same file again re-triggers change.
		e.target.value = "";
	};

	return (
		<div>
			<div className="flex items-center justify-between">
				<h4 className="docket text-thread-ink">Portfolio</h4>
				<span className="docket-num text-muted-foreground text-sm">
					{count} / {maxImages}
				</span>
			</div>

			{count > 0 && (
				<div className="mt-3 flex flex-wrap gap-2">
					{service.portfolio.map((image) => (
						<div
							key={image.uuid}
							className="group relative size-24 overflow-hidden border border-border bg-secondary"
						>
							{image.url && (
								// biome-ignore lint/performance/noImgElement: presigned S3 URL has a dynamic host/expiry, unsuited to next/image
								<img
									src={image.url}
									alt={image.caption ?? ""}
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							)}
							<Button
								tone="destructive"
								variant="solid"
								size="icon-xs"
								aria-label="Remove image"
								className="absolute top-1 right-1 opacity-90"
								onClick={() => remove.mutate({ portfolioUuid: image.uuid })}
							>
								<Trash2Icon className="size-3.5" />
							</Button>
						</div>
					))}
				</div>
			)}

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={onFile}
			/>
			<Button
				tone="secondary"
				variant="outline"
				size="sm"
				className="mt-3"
				disabled={atLimit || upload.isPending}
				onClick={() => inputRef.current?.click()}
			>
				<ImagePlusIcon className="size-4" />
				{upload.isPending ? "Uploading…" : "Upload image"}
			</Button>
			{atLimit && (
				<p className="mt-2 text-muted-foreground text-xs">
					You've reached the {maxImages}-image limit for this service.
				</p>
			)}
		</div>
	);
}
