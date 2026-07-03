import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { contentSourceEnum } from "./enums.schema";
import { weddings } from "./wedding.schema";

/**
 * A task on a wedding's planning checklist. `source` distinguishes items the
 * planner auto-generated from ones the couple added, so regenerating the
 * template never clobbers manual edits.
 */
export const checklistItems = pgTable(
	"checklist_items",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		title: text("title").notNull(),
		description: text("description"),
		category: text("category"),
		dueDate: timestamp("due_date", { withTimezone: true }),
		isComplete: boolean("is_complete").notNull().default(false),
		source: contentSourceEnum("source").notNull().default("manual"),
		sortOrder: integer("sort_order").notNull().default(0),
		...auditColumns(),
	},
	(table) => [index("checklist_items_wedding_id_idx").on(table.weddingId)],
);

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
	wedding: one(weddings, {
		fields: [checklistItems.weddingId],
		references: [weddings.id],
	}),
}));
