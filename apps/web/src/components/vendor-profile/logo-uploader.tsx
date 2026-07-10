import { Button } from "@repo/ui/components/button";
import { ImageIcon } from "lucide-react";
import { useRef } from "react";
import { useUploadLogo } from "../../api/vendor-profile.api";

export function LogoUploader({
	logoUrl,
	businessName,
}: {
	logoUrl: string | null;
	businessName: string;
}) {
	const upload = useUploadLogo();
	const inputRef = useRef<HTMLInputElement>(null);

	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			upload.mutate({ file });
		}
		e.target.value = "";
	};

	return (
		<div className="flex shrink-0 flex-col items-center gap-2">
			<div className="flex size-24 items-center justify-center overflow-hidden border border-border bg-secondary">
				{logoUrl ? (
					// biome-ignore lint/performance/noImgElement: presigned S3 URL has a dynamic host/expiry, unsuited to next/image
					<img
						src={logoUrl}
						alt={businessName}
						className="h-full w-full object-cover"
					/>
				) : (
					<ImageIcon
						className="size-7 text-muted-foreground"
						strokeWidth={1.5}
					/>
				)}
			</div>
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
				disabled={upload.isPending}
				onClick={() => inputRef.current?.click()}
			>
				{upload.isPending ? "Uploading…" : logoUrl ? "Replace" : "Upload logo"}
			</Button>
			{!logoUrl && (
				<p className="text-center text-muted-foreground text-xs">
					Required to publish
				</p>
			)}
		</div>
	);
}
