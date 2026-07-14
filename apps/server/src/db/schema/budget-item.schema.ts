import { relations, sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	pgTable,
	serial,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { categories } from "./category.schema";
import { contentSourceEnum } from "./enums.schema";
import { servicePackages } from "./service-package.schema";
import { vendorBusinesses } from "./vendor-business.schema";
import { weddings } from "./wedding.schema";

/**
 * A line in a wedding's budget tracker. estimated vs actual cents lets couples
 * track spend. Each line is filed under exactly one category: either a seeded
 * taxonomy category (categoryId) or the couple's own free-text customCategory —
 * the check constraint enforces exactly one. When `source` is "booking" the
 * line is auto-populated from a confirmed booking (servicePackageId identifies
 * it — one line per booked package — with vendorBusinessId denormalized for
 * display); "manual" lines are the couple's own expenses.
 */
export const budgetItems = pgTable(
	"budget_items",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		categoryId: integer("category_id").references(() => categories.id),
		customCategory: text("custom_category"),
		label: text("label").notNull(),
		estimatedCents: integer("estimated_cents"),
		actualCents: integer("actual_cents"),
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
		index("budget_items_category_id_idx").on(table.categoryId),
		index("budget_items_vendor_business_id_idx").on(table.vendorBusinessId),
		check(
			"budget_items_category_xor_custom_chk",
			sql`(${table.categoryId} is not null) <> (${table.customCategory} is not null)`,
		),
	],
);

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
	wedding: one(weddings, {
		fields: [budgetItems.weddingId],
		references: [weddings.id],
	}),
	category: one(categories, {
		fields: [budgetItems.categoryId],
		references: [categories.id],
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
