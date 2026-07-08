import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { priceUnitEnum } from "./enums.schema";
import { vendorServices } from "./vendor-service.schema";

/**
 * A priced offering under a vendor service. priceUnit says how priceCents is
 * measured (flat total, per hour, or per guest) so the couple's budget tracker
 * can turn it into an estimate.
 */
export const servicePackages = pgTable(
	"service_packages",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorServiceId: integer("vendor_service_id")
			.notNull()
			.references(() => vendorServices.id),
		name: text("name").notNull(),
		description: text("description"),
		priceCents: integer("price_cents").notNull(),
		priceUnit: priceUnitEnum("price_unit").notNull().default("flat"),
		isActive: boolean("is_active").notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0),
		...auditColumns(),
	},
	(table) => [
		index("service_packages_vendor_service_id_idx").on(table.vendorServiceId),
	],
);

export const servicePackagesRelations = relations(
	servicePackages,
	({ one }) => ({
		vendorService: one(vendorServices, {
			fields: [servicePackages.vendorServiceId],
			references: [vendorServices.id],
		}),
	}),
);
