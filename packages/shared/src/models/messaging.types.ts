import { z } from "zod";

/** A single message in a thread. `isMine` drives alignment in the UI. */
export const MessageSchema = z.object({
	uuid: z.string().uuid(),
	body: z.string(),
	senderName: z.string(),
	isMine: z.boolean(),
	sentAt: z.date(),
});
export type MessageSchema = z.infer<typeof MessageSchema>;

/**
 * A conversation as the caller sees it. `title`/`avatarUrl` are the *other*
 * party (couple sees the business; vendor sees the couple), so the same thread
 * renders role-aware without the client knowing which side it's on.
 */
export const ThreadSummarySchema = z.object({
	uuid: z.string().uuid(),
	counterpartyKind: z.enum(["vendor", "couple"]),
	title: z.string(),
	subtitle: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	lastMessageAt: z.date().nullable(),
	lastMessagePreview: z.string().nullable(),
	unreadCount: z.number().int(),
});
export type ThreadSummarySchema = z.infer<typeof ThreadSummarySchema>;

export const ThreadListSchema = z.object({
	items: z.array(ThreadSummarySchema),
});
export type ThreadListSchema = z.infer<typeof ThreadListSchema>;

export const ThreadDetailSchema = z.object({
	thread: ThreadSummarySchema,
	messages: z.array(MessageSchema),
});
export type ThreadDetailSchema = z.infer<typeof ThreadDetailSchema>;

/** Couples start threads (gated: the vendor must be saved or booked). */
export const StartThreadInputSchema = z.object({
	vendorBusinessUuid: z.string().uuid(),
});
export type StartThreadInputSchema = z.infer<typeof StartThreadInputSchema>;

export const ConversationUuidInputSchema = z.object({
	conversationUuid: z.string().uuid(),
});
export type ConversationUuidInputSchema = z.infer<
	typeof ConversationUuidInputSchema
>;

export const SendMessageInputSchema = z.object({
	conversationUuid: z.string().uuid(),
	body: z.string().trim().min(1, "Enter a message").max(4000),
});
export type SendMessageInputSchema = z.infer<typeof SendMessageInputSchema>;

export const MarkReadResultSchema = z.object({
	unreadCount: z.number().int(),
});
export type MarkReadResultSchema = z.infer<typeof MarkReadResultSchema>;
