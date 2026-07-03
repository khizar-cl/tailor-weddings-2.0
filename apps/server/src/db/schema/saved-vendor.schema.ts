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
import { vendorProfiles } from "./vendor-profile.schema";
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
		vendorProfileId: integer("vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		notes: text("notes"),
		savedAt: timestamp("saved_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		...auditColumns(),
	},
	(table) => [
		unique("saved_vendors_wedding_vendor_uniq").on(
			table.weddingId,
			table.vendorProfileId,
		),
		index("saved_vendors_wedding_id_idx").on(table.weddingId),
		index("saved_vendors_vendor_profile_id_idx").on(table.vendorProfileId),
	],
);

export const savedVendorsRelations = relations(savedVendors, ({ one }) => ({
	wedding: one(weddings, {
		fields: [savedVendors.weddingId],
		references: [weddings.id],
	}),
	vendorProfile: one(vendorProfiles, {
		fields: [savedVendors.vendorProfileId],
		references: [vendorProfiles.id],
	}),
}));
