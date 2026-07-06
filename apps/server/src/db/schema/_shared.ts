import { integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * Standard audit + soft-delete columns shared by every domain table.
 *
 * createdBy/updatedBy are nullable because some rows are system-generated
 * (recommendations, review requests, notifications) and have no acting user.
 * Exposed as a factory so each table gets its own fresh column builders rather
 * than sharing a single builder instance across tables.
 */
export const auditColumns = () => ({
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedBy: integer("updated_by").references(() => users.id),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
