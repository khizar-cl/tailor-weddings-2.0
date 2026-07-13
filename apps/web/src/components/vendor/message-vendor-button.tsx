"use client";

import { Button } from "@repo/ui/components/button";
import { MessageCircleIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useStartThread } from "../../api/messaging.api";

/** Opens (or reopens) the couple↔vendor thread and jumps to it. */
export function MessageVendorButton({ vendorUuid }: { vendorUuid: string }) {
	const router = useRouter();
	const start = useStartThread();

	return (
		<Button
			tone="secondary"
			variant="outline"
			disabled={start.isPending}
			onClick={() =>
				start.mutate(
					{ vendorBusinessUuid: vendorUuid },
					{
						onSuccess: (thread) =>
							router.push(`/portal/messages?thread=${thread.uuid}` as Route),
					},
				)
			}
		>
			<MessageCircleIcon className="size-4" />
			Message
		</Button>
	);
}
