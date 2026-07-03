import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { vendorProfiles } from "./vendor-profile.schema";

// Paired with PriceUnitEnum in packages/shared/src/models/vendor.types.ts.
export const priceUnitEnum = pgEnum("price_unit", [
	"flat",
	"hourly",
	"per_guest",
]);

/**
 * A priced service offering on a vendor profile. priceUnit says how priceCents
 * is measured (flat total, per hour, or per guest) so the couple's budget
 * tracker can turn it into an estimate.
 */
export const servicePackages = pgTable(
	"service_packages",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorProfileId: integer("vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		name: text("name").notNull(),
		description: text("description"),
		priceCents: integer("price_cents").notNull(),
		priceUnit: priceUnitEnum("price_unit").notNull().default("flat"),
		isActive: boolean("is_active").notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0),
		...auditColumns(),
	},
	(table) => [
		index("service_packages_vendor_profile_id_idx").on(table.vendorProfileId),
	],
);

export const servicePackagesRelations = relations(
	servicePackages,
	({ one }) => ({
		vendorProfile: one(vendorProfiles, {
			fields: [servicePackages.vendorProfileId],
			references: [vendorProfiles.id],
		}),
	}),
);
