import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * A generic in-app notification. Deliberately schema-light so it can carry any
 * kind of notice without a migration: `type` is a free-form string (resolved
 * against an application-level registry in @repo/shared, not a DB enum) and
 * `data` holds the type-specific payload. Adding a new kind — offers, events,
 * anything — needs no change to this table. `actionUrl` is the deep-link
 * target; unread = readAt IS NULL.
 */
export const notifications = pgTable(
	"notifications",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id),
		type: text("type").notNull(),
		title: text("title").notNull(),
		body: text("body"),
		data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
		actionUrl: text("action_url"),
		readAt: timestamp("read_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("notifications_user_id_read_at_idx").on(table.userId, table.readAt),
		index("notifications_type_idx").on(table.type),
	],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
}));
