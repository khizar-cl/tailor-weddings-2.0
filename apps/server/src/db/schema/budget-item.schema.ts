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
import { vendorBusinesses } from "./vendor-business.schema";
import { vendorServices } from "./vendor-service.schema";
import { weddings } from "./wedding.schema";

/**
 * A line in a wedding's budget tracker. estimated vs actual cents lets couples
 * track spend. When `source` is "booking" the line is auto-populated from a
 * confirmed booking (vendorServiceId identifies it — one line per booked
 * service — with vendorBusinessId/servicePackageId denormalized for display);
 * "manual" lines are the couple's own expenses.
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
		vendorServiceId: integer("vendor_service_id").references(
			() => vendorServices.id,
		),
		vendorBusinessId: integer("vendor_business_id").references(
			() => vendorBusinesses.id,
		),
		servicePackageId: integer("service_package_id").references(
			() => servicePackages.id,
		),
		source: contentSourceEnum("source").notNull().default("manual"),
		...auditColumns(),
	},
	(table) => [
		index("budget_items_wedding_id_idx").on(table.weddingId),
		index("budget_items_vendor_service_id_idx").on(table.vendorServiceId),
		index("budget_items_vendor_business_id_idx").on(table.vendorBusinessId),
	],
);

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
	wedding: one(weddings, {
		fields: [budgetItems.weddingId],
		references: [weddings.id],
	}),
	vendorService: one(vendorServices, {
		fields: [budgetItems.vendorServiceId],
		references: [vendorServices.id],
	}),
	vendorBusiness: one(vendorBusinesses, {
		fields: [budgetItems.vendorBusinessId],
		references: [vendorBusinesses.id],
	}),
	servicePackage: one(servicePackages, {
		fields: [budgetItems.servicePackageId],
		references: [servicePackages.id],
	}),
}));
