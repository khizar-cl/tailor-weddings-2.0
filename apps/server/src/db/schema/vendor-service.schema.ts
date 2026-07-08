import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { categories } from "./category.schema";
import { priceUnitEnum } from "./enums.schema";
import { portfolioMedia } from "./portfolio-media.schema";
import { servicePackages } from "./service-package.schema";
import { vendorBusinesses } from "./vendor-business.schema";

/**
 * One service a business offers. It is either a taxonomy category (categoryId —
 * the only kind shown in discovery/matching) or a free-text customLabel that is
 * hidden until an admin promotes it into a real category; the check constraint
 * enforces exactly one of the two. Owns its own packages and portfolio, and is
 * published independently of its sibling services (per-service publishing).
 */
export const vendorServices = pgTable(
	"vendor_services",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorBusinessId: integer("vendor_business_id")
			.notNull()
			.references(() => vendorBusinesses.id),
		categoryId: integer("category_id").references(() => categories.id),
		customLabel: text("custom_label"),
		description: text("description"),
		startingPriceCents: integer("starting_price_cents"),
		priceUnit: priceUnitEnum("price_unit").notNull().default("flat"),
		isPrimary: boolean("is_primary").notNull().default(false),
		isPublished: boolean("is_published").notNull().default(false),
		details: jsonb("details").$type<Record<string, unknown>>(),
		sortOrder: integer("sort_order").notNull().default(0),
		...auditColumns(),
	},
	(table) => [
		unique("vendor_services_business_category_uniq").on(
			table.vendorBusinessId,
			table.categoryId,
		),
		index("vendor_services_vendor_business_id_idx").on(table.vendorBusinessId),
		index("vendor_services_category_id_idx").on(table.categoryId),
		index("vendor_services_is_published_idx").on(table.isPublished),
		check(
			"vendor_services_category_xor_custom_chk",
			sql`(${table.categoryId} is not null) <> (${table.customLabel} is not null)`,
		),
	],
);

export const vendorServicesRelations = relations(
	vendorServices,
	({ one, many }) => ({
		business: one(vendorBusinesses, {
			fields: [vendorServices.vendorBusinessId],
			references: [vendorBusinesses.id],
		}),
		category: one(categories, {
			fields: [vendorServices.categoryId],
			references: [categories.id],
		}),
		packages: many(servicePackages),
		portfolio: many(portfolioMedia),
	}),
);
