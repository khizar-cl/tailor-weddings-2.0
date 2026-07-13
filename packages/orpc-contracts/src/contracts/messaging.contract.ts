import { oc } from "@orpc/contract";
import {
	ConversationUuidInputSchema,
	MarkReadResultSchema,
	MessageSchema,
	SendMessageInputSchema,
	StartThreadInputSchema,
	ThreadDetailSchema,
	ThreadListSchema,
	ThreadSummarySchema,
} from "@repo/shared";

export const messagingContract = {
	listThreads: oc.output(ThreadListSchema),
	getThread: oc.input(ConversationUuidInputSchema).output(ThreadDetailSchema),
	startThread: oc.input(StartThreadInputSchema).output(ThreadSummarySchema),
	sendMessage: oc.input(SendMessageInputSchema).output(MessageSchema),
	markRead: oc.input(ConversationUuidInputSchema).output(MarkReadResultSchema),
};
