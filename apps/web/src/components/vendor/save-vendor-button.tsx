"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
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
	const isIcon = variant === "icon";
	const label = isSaved ? "Saved" : "Save to team";

	// Saving is one-tap; removing from the shortlist confirms first (below).
	const button = (
		<Button
			type="button"
			size={isIcon ? "icon-sm" : undefined}
			tone={isSaved ? "primary" : "secondary"}
			variant={isSaved ? "solid" : "outline"}
			disabled={isPending}
			aria-pressed={isSaved}
			aria-label={isIcon ? label : undefined}
			title={isIcon ? label : undefined}
			{...(isSaved
				? {}
				: { onClick: () => save.mutate({ vendorBusinessUuid: vendorUuid }) })}
		>
			<BookmarkIcon
				className={cn(!isIcon && "size-4", isSaved && "fill-current")}
			/>
			{!isIcon && label}
		</Button>
	);

	if (!isSaved) {
		return button;
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger render={button} />
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove from your shortlist?</AlertDialogTitle>
					<AlertDialogDescription>
						This removes the vendor from your saved team. You can save them
						again anytime.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Keep saved</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => unsave.mutate({ vendorBusinessUuid: vendorUuid })}
					>
						Remove
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
