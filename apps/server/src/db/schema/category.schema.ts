import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

/**
 * Seeded reference table of vendor service categories (photography, floral,
 * planning, ...). A table rather than a pgEnum so admins can add categories
 * without a migration. Vendor profiles reference a single category each.
 */
export const categories = pgTable("categories", {
	id: serial("id").primaryKey(),
	uuid: uuid("uuid").notNull().unique().defaultRandom(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
