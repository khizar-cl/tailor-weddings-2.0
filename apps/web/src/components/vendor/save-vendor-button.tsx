"use client";

import { Button } from "@repo/ui/components/button";
import { BookmarkIcon } from "lucide-react";
import { useSaveVendor, useUnsaveVendor } from "../../api/vendor.api";

interface SaveVendorButtonProps {
	vendorUuid: string;
	isSaved: boolean;
	/** "icon" for a compact toggle on cards, "full" for a labelled action. */
	variant?: "icon" | "full";
}

export function SaveVendorButton({
	vendorUuid,
	isSaved,
	variant = "icon",
}: SaveVendorButtonProps) {
	const save = useSaveVendor();
	const unsave = useUnsaveVendor();
	const isPending = save.isPending || unsave.isPending;

	const toggle = () => {
		if (isSaved) {
			unsave.mutate({ vendorBusinessUuid: vendorUuid });
		} else {
			save.mutate({ vendorBusinessUuid: vendorUuid });
		}
	};

	const label = isSaved ? "Saved" : "Save to team";

	if (variant === "icon") {
		return (
			<Button
				type="button"
				size="icon-sm"
				tone={isSaved ? "primary" : "secondary"}
				variant={isSaved ? "solid" : "outline"}
				disabled={isPending}
				aria-pressed={isSaved}
				aria-label={label}
				title={label}
				onClick={toggle}
			>
				<BookmarkIcon className={isSaved ? "fill-current" : undefined} />
			</Button>
		);
	}

	return (
		<Button
			type="button"
			tone={isSaved ? "primary" : "secondary"}
			variant={isSaved ? "solid" : "outline"}
			disabled={isPending}
			aria-pressed={isSaved}
			onClick={toggle}
		>
			<BookmarkIcon className={isSaved ? "size-4 fill-current" : "size-4"} />
			{label}
		</Button>
	);
}
