import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { conversations } from "./conversation.schema";
import { users } from "./users.schema";

/**
 * A single chat message in a conversation. Soft-deletable via the audit
 * columns' deletedAt.
 */
export const messages = pgTable(
	"messages",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		conversationId: integer("conversation_id")
			.notNull()
			.references(() => conversations.id),
		senderUserId: integer("sender_user_id")
			.notNull()
			.references(() => users.id),
		body: text("body").notNull(),
		...auditColumns(),
	},
	(table) => [
		index("messages_conversation_id_created_at_idx").on(
			table.conversationId,
			table.createdAt,
		),
		index("messages_sender_user_id_idx").on(table.senderUserId),
	],
);

export const messagesRelations = relations(messages, ({ one }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id],
	}),
	sender: one(users, {
		fields: [messages.senderUserId],
		references: [users.id],
	}),
}));
