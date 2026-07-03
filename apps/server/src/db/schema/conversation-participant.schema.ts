import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { conversations } from "./conversation.schema";
import { users } from "./users.schema";

/**
 * A user's membership in a conversation — the couple side (up to two users)
 * plus the vendor. lastReadAt drives unread counts (messages newer than it,
 * from someone other than this user).
 */
export const conversationParticipants = pgTable(
	"conversation_participants",
	{
		id: serial("id").primaryKey(),
		conversationId: integer("conversation_id")
			.notNull()
			.references(() => conversations.id),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id),
		lastReadAt: timestamp("last_read_at", { withTimezone: true }),
	},
	(table) => [
		unique("conversation_participants_conversation_user_uniq").on(
			table.conversationId,
			table.userId,
		),
		index("conversation_participants_user_id_idx").on(table.userId),
	],
);

export const conversationParticipantsRelations = relations(
	conversationParticipants,
	({ one }) => ({
		conversation: one(conversations, {
			fields: [conversationParticipants.conversationId],
			references: [conversations.id],
		}),
		user: one(users, {
			fields: [conversationParticipants.userId],
			references: [users.id],
		}),
	}),
);
