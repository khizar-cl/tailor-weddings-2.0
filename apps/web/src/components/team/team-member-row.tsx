import type { WeddingTeamMemberSchema } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { VendorThumb } from "../vendor/vendor-thumb";

export function TeamMemberRow({
	member,
	onRemove,
	isRemoving,
}: {
	member: WeddingTeamMemberSchema;
	onRemove: (vendorBusinessUuid: string) => void;
	isRemoving: boolean;
}) {
	const location = [member.city, member.region].filter(Boolean).join(", ");
	const meta = [member.primaryCategoryName, location]
		.filter(Boolean)
		.join(" · ");

	return (
		<li className="flex items-center gap-4 border-border border-b py-4 last:border-0">
			<VendorThumb
				logoUrl={member.logoUrl}
				name={member.businessName}
				categoryName={member.primaryCategoryName}
				className="size-14 shrink-0"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<Link
						href={`/portal/discover/${member.vendorBusinessUuid}`}
						className="font-serif text-foreground hover:underline"
					>
						{member.businessName}
					</Link>
					{member.isVerified && (
						<Badge tone="success" variant="outline">
							Verified
						</Badge>
					)}
					{member.isBooked ? (
						<Badge tone="info" variant="outline">
							{member.bookingStatus === "confirmed" ? "Booked" : "Requested"}
						</Badge>
					) : (
						<Badge tone="secondary" variant="outline">
							Saved
						</Badge>
					)}
				</div>
				{meta && <p className="docket mt-1 text-thread-ink">{meta}</p>}
			</div>
			{member.isSaved && (
				<Button
					tone="secondary"
					variant="ghost"
					size="icon-sm"
					aria-label={`Remove ${member.businessName} from your team`}
					disabled={isRemoving}
					onClick={() => onRemove(member.vendorBusinessUuid)}
				>
					<XIcon className="size-4" />
				</Button>
			)}
		</li>
	);
}
