import type { ThreadSummarySchema } from "@repo/shared";
import { cn } from "@repo/ui/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { VendorThumb } from "../vendor/vendor-thumb";

export function ThreadList({
	items,
	selectedUuid,
	onSelect,
}: {
	items: ThreadSummarySchema[];
	selectedUuid: string | null;
	onSelect: (uuid: string) => void;
}) {
	if (items.length === 0) {
		return (
			<p className="p-4 text-muted-foreground text-sm">
				No conversations yet. Save a vendor and start a chat from their page.
			</p>
		);
	}

	return (
		<ul>
			{items.map((thread) => (
				<li key={thread.uuid}>
					<button
						type="button"
						onClick={() => onSelect(thread.uuid)}
						className={cn(
							"flex w-full items-center gap-3 border-border border-b px-4 py-3 text-left transition hover:bg-accent",
							selectedUuid === thread.uuid && "bg-accent",
						)}
					>
						<VendorThumb
							logoUrl={thread.avatarUrl}
							name={thread.title}
							categoryName={null}
							className="size-10 shrink-0"
						/>
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between gap-2">
								<span className="truncate font-serif text-foreground text-sm">
									{thread.title}
								</span>
								{thread.lastMessageAt && (
									<span className="docket shrink-0 text-thread-ink text-xs">
										{formatDistanceToNowStrict(thread.lastMessageAt)}
									</span>
								)}
							</div>
							<div className="mt-0.5 flex items-center justify-between gap-2">
								<span className="truncate text-muted-foreground text-xs">
									{thread.lastMessagePreview ?? "No messages yet"}
								</span>
								{thread.unreadCount > 0 && (
									<span className="docket-num flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
										{thread.unreadCount}
									</span>
								)}
							</div>
						</div>
					</button>
				</li>
			))}
		</ul>
	);
}
