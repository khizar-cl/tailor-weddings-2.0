import { Badge } from "@repo/ui/components/badge";
import { UserIcon } from "lucide-react";
import Image from "next/image";

export function AccountMasthead({
	name,
	imageUrl,
	isAdmin,
}: {
	name: string;
	imageUrl: string | null;
	isAdmin: boolean;
}) {
	return (
		<section className="flex flex-wrap items-center gap-5 border-border border-b pb-8">
			{imageUrl ? (
				<Image
					src={imageUrl}
					width={72}
					height={72}
					alt={name}
					className="mp-mask size-18 rounded-full object-cover ring-1 ring-border"
				/>
			) : (
				<div className="flex size-18 items-center justify-center rounded-full bg-primary/12 ring-1 ring-border">
					<UserIcon className="size-8 text-primary" strokeWidth={1.75} />
				</div>
			)}
			<div className="min-w-0">
				<span className="docket text-thread-ink">Your account</span>
				<div className="mt-3 flex flex-wrap items-center gap-3">
					<h1 className="mp-mask font-medium font-serif text-3xl text-foreground sm:text-4xl">
						{name}
					</h1>
					{isAdmin && (
						<Badge tone="info" variant="outline">
							Admin
						</Badge>
					)}
				</div>
			</div>
		</section>
	);
}
