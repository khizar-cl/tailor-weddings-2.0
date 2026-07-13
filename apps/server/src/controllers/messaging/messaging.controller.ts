import { protectedProcedure } from "../../orpc/procedures";
import {
	getThread,
	listThreads,
	markRead,
	sendMessage,
	startThread,
} from "./messaging.service";

export const messagingController = {
	listThreads: protectedProcedure.messaging.listThreads.handler(
		async ({ context }) => {
			return listThreads(context.dbUser.id);
		},
	),
	getThread: protectedProcedure.messaging.getThread.handler(
		async ({ context, input }) => {
			return getThread(context.dbUser.id, input.conversationUuid);
		},
	),
	startThread: protectedProcedure.messaging.startThread.handler(
		async ({ context, input }) => {
			return startThread(context.dbUser.id, input.vendorBusinessUuid);
		},
	),
	sendMessage: protectedProcedure.messaging.sendMessage.handler(
		async ({ context, input }) => {
			return sendMessage(context.dbUser.id, input);
		},
	),
	markRead: protectedProcedure.messaging.markRead.handler(
		async ({ context, input }) => {
			return markRead(context.dbUser.id, input.conversationUuid);
		},
	),
};
