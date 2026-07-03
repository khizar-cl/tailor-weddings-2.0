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
import { contentSourceEnum } from "./enums.schema";
import { servicePackages } from "./service-package.schema";
import { vendorProfiles } from "./vendor-profile.schema";
import { weddings } from "./wedding.schema";

/**
 * A line in a wedding's budget tracker. estimated vs actual cents lets couples
 * track spend. When `source` is "booking" the line is auto-populated from a
 * booked vendor's package (vendorProfileId/servicePackageId set); "manual"
 * lines are the couple's own expenses.
 */
export const budgetItems = pgTable(
	"budget_items",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		category: text("category").notNull(),
		label: text("label").notNull(),
		estimatedCents: integer("estimated_cents"),
		actualCents: integer("actual_cents"),
		vendorProfileId: integer("vendor_profile_id").references(
			() => vendorProfiles.id,
		),
		servicePackageId: integer("service_package_id").references(
			() => servicePackages.id,
		),
		source: contentSourceEnum("source").notNull().default("manual"),
		...auditColumns(),
	},
	(table) => [
		index("budget_items_wedding_id_idx").on(table.weddingId),
		index("budget_items_vendor_profile_id_idx").on(table.vendorProfileId),
	],
);

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
	wedding: one(weddings, {
		fields: [budgetItems.weddingId],
		references: [weddings.id],
	}),
	vendorProfile: one(vendorProfiles, {
		fields: [budgetItems.vendorProfileId],
		references: [vendorProfiles.id],
	}),
	servicePackage: one(servicePackages, {
		fields: [budgetItems.servicePackageId],
		references: [servicePackages.id],
	}),
}));
