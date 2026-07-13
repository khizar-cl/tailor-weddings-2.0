"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { SendHorizonalIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { z } from "zod";
import {
	useMarkThreadRead,
	useSendMessage,
	useThread,
} from "../../api/messaging.api";
import Loader from "../loader";

const ComposerSchema = z.object({
	body: z.string().trim().min(1).max(4000),
});

export function ConversationPane({
	conversationUuid,
}: {
	conversationUuid: string;
}) {
	const thread = useThread(conversationUuid);
	const send = useSendMessage();
	const markRead = useMarkThreadRead();

	const messages = thread.data?.messages ?? [];
	const bottomRef = useRef<HTMLDivElement>(null);

	// Keep an open thread marked read — on open and as polled messages arrive.
	const markReadMutate = markRead.mutate;
	const unreadCount = thread.data?.thread.unreadCount ?? 0;
	useEffect(() => {
		if (unreadCount > 0) markReadMutate({ conversationUuid });
	}, [conversationUuid, unreadCount, markReadMutate]);

	// Stick to the latest message when one is sent, received, or the thread opens.
	const lastMessageUuid = messages.at(-1)?.uuid;
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [lastMessageUuid]);

	const form = useForm({
		defaultValues: { body: "" },
		validators: { onChange: ComposerSchema },
		onSubmit: ({ value }) => {
			send.mutate(
				{ conversationUuid, body: value.body.trim() },
				{ onSuccess: () => form.reset() },
			);
		},
	});

	if (thread.isLoading) return <Loader />;
	if (thread.error) {
		return (
			<p className="p-4 text-destructive-foreground text-sm">
				{thread.error.message}
			</p>
		);
	}
	if (!thread.data) return null;

	const summary = thread.data.thread;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<header className="shrink-0 border-border border-b px-5 py-4">
				<h2 className="font-serif text-foreground text-lg">{summary.title}</h2>
				{summary.subtitle && (
					<p className="docket text-thread-ink">{summary.subtitle}</p>
				)}
			</header>

			<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
				{messages.length === 0 ? (
					<p className="text-center text-muted-foreground text-sm">
						No messages yet — say hello.
					</p>
				) : (
					messages.map((message) => (
						<div
							key={message.uuid}
							className={cn(
								"flex flex-col",
								message.isMine ? "items-end" : "items-start",
							)}
						>
							<div
								className={cn(
									"max-w-[80%] rounded-md px-3 py-2 text-sm",
									message.isMine
										? "bg-primary text-primary-foreground"
										: "bg-muted text-foreground",
								)}
							>
								<p className="whitespace-pre-line">{message.body}</p>
							</div>
							<span className="docket mt-1 text-thread-ink text-xs">
								{format(message.sentAt, "MMM d, h:mm a")}
							</span>
						</div>
					))
				)}
				<div ref={bottomRef} />
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="flex shrink-0 items-end gap-2 border-border border-t p-3"
			>
				<form.Field
					name="body"
					children={(field) => (
						<Textarea
							aria-label="Message"
							rows={1}
							placeholder="Write a message…"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									form.handleSubmit();
								}
							}}
							className="max-h-32 min-h-9 flex-1 resize-none"
						/>
					)}
				/>
				<form.Subscribe
					selector={(s) => ({ canSubmit: s.canSubmit, body: s.values.body })}
					children={({ canSubmit, body }) => (
						<Button
							type="submit"
							size="icon"
							aria-label="Send"
							disabled={
								send.isPending || !canSubmit || body.trim().length === 0
							}
						>
							<SendHorizonalIcon className="size-4" />
						</Button>
					)}
				/>
			</form>
		</div>
	);
}
