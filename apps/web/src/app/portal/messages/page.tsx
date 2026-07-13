"use client";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useThreads } from "../../../api/messaging.api";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import Loader from "../../../components/loader";
import { ConversationPane } from "../../../components/messaging/conversation-pane";
import { ThreadList } from "../../../components/messaging/thread-list";

export default function MessagesPage() {
	const params = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const threads = useThreads();
	const items = threads.data?.items ?? [];
	const selected = params.get("thread");

	const select = (uuid: string | null) => {
		const qs = uuid ? `?thread=${uuid}` : "";
		router.replace(`${pathname}${qs}` as Route, { scroll: false });
	};

	// Fill the area under the sticky 4rem header; dvh keeps mobile browser
	// chrome from pushing the composer off-screen.
	return (
		<div className="flex h-[calc(100dvh-4rem)] flex-col bg-background p-6">
			<div className="shrink-0">
				<AppBreadcrumb />
			</div>

			<header className="shrink-0 border-border border-b pt-4 pb-4">
				<span className="docket text-thread-ink">Inbox</span>
				<h1 className="mt-1 font-medium font-serif text-2xl text-foreground sm:text-3xl">
					Messages
				</h1>
			</header>

			{threads.isLoading ? (
				<div className="mt-6">
					<Loader />
				</div>
			) : threads.error ? (
				<p className="mt-6 text-destructive-foreground text-sm">
					{threads.error.message}
				</p>
			) : (
				<div className="@container mt-6 min-h-0 flex-1">
					<div className="grid h-full @3xl:grid-cols-[20rem_minmax(0,1fr)] grid-cols-1 overflow-hidden border border-border">
						{/* Thread list — hidden on a narrow container once a thread is open. */}
						<div
							className={cn(
								"@3xl:block min-h-0 overflow-y-auto @3xl:border-border @3xl:border-r",
								selected ? "hidden" : "block",
							)}
						>
							<ThreadList
								items={items}
								selectedUuid={selected}
								onSelect={select}
							/>
						</div>

						{/* Conversation — hidden on a narrow container until one is selected. */}
						<div
							className={cn(
								"@3xl:flex min-h-0 flex-col",
								selected ? "flex" : "hidden",
							)}
						>
							{selected ? (
								<>
									<Button
										tone="secondary"
										variant="ghost"
										size="sm"
										className="m-2 @3xl:hidden self-start"
										onClick={() => select(null)}
									>
										<ArrowLeftIcon className="size-4" />
										All conversations
									</Button>
									<ConversationPane conversationUuid={selected} />
								</>
							) : (
								<div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground text-sm">
									Select a conversation to start reading.
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
