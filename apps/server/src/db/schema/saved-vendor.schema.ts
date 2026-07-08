import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { vendorBusinesses } from "./vendor-business.schema";
import { weddings } from "./wedding.schema";

/**
 * A couple's private shortlist ("saved to my team"). Personal-use only — the
 * vendor never sees that they were saved. Distinct from a booking, which is a
 * confirmed engagement visible to both sides.
 */
export const savedVendors = pgTable(
	"saved_vendors",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorBusinessId: integer("vendor_business_id")
			.notNull()
			.references(() => vendorBusinesses.id),
		notes: text("notes"),
		savedAt: timestamp("saved_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		...auditColumns(),
	},
	(table) => [
		unique("saved_vendors_wedding_vendor_uniq").on(
			table.weddingId,
			table.vendorBusinessId,
		),
		index("saved_vendors_wedding_id_idx").on(table.weddingId),
		index("saved_vendors_vendor_business_id_idx").on(table.vendorBusinessId),
	],
);

export const savedVendorsRelations = relations(savedVendors, ({ one }) => ({
	wedding: one(weddings, {
		fields: [savedVendors.weddingId],
		references: [weddings.id],
	}),
	vendorBusiness: one(vendorBusinesses, {
		fields: [savedVendors.vendorBusinessId],
		references: [vendorBusinesses.id],
	}),
}));
