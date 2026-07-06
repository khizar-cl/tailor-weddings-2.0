import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { messages } from "./message.schema";
import { vendorProfiles } from "./vendor-profile.schema";
import { weddings } from "./wedding.schema";

/**
 * A message thread between a couple and a vendor profile — one per
 * (wedding, vendor profile) pair. Only created once the couple has saved or
 * booked the vendor, so vendors can't be cold-messaged.
 */
export const conversations = pgTable(
	"conversations",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorProfileId: integer("vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
		...auditColumns(),
	},
	(table) => [
		unique("conversations_wedding_vendor_uniq").on(
			table.weddingId,
			table.vendorProfileId,
		),
		index("conversations_wedding_id_idx").on(table.weddingId),
		index("conversations_vendor_profile_id_idx").on(table.vendorProfileId),
	],
);

export const conversationsRelations = relations(
	conversations,
	({ one, many }) => ({
		wedding: one(weddings, {
			fields: [conversations.weddingId],
			references: [weddings.id],
		}),
		vendorProfile: one(vendorProfiles, {
			fields: [conversations.vendorProfileId],
			references: [vendorProfiles.id],
		}),
		messages: many(messages),
	}),
);
