import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { servicePackages } from "./service-package.schema";
import { vendorProfiles } from "./vendor-profile.schema";
import { weddings } from "./wedding.schema";

// Paired with BookingStatusEnum in packages/shared/src/models/wedding.types.ts.
export const bookingStatusEnum = pgEnum("booking_status", [
	"pending",
	"confirmed",
	"cancelled",
]);

/**
 * A confirmed engagement between a wedding and a vendor profile — the "real"
 * team. Requested by the couple (pending) and accepted by the vendor
 * (confirmed). Confirmed bookings drive budget auto-population and are the
 * verified-collaboration proof that gates peer reviews.
 */
export const bookings = pgTable(
	"bookings",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorProfileId: integer("vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		servicePackageId: integer("service_package_id").references(
			() => servicePackages.id,
		),
		status: bookingStatusEnum("status").notNull().default("pending"),
		bookedAt: timestamp("booked_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		...auditColumns(),
	},
	(table) => [
		unique("bookings_wedding_vendor_uniq").on(
			table.weddingId,
			table.vendorProfileId,
		),
		index("bookings_wedding_id_idx").on(table.weddingId),
		index("bookings_vendor_profile_id_idx").on(table.vendorProfileId),
	],
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
	wedding: one(weddings, {
		fields: [bookings.weddingId],
		references: [weddings.id],
	}),
	vendorProfile: one(vendorProfiles, {
		fields: [bookings.vendorProfileId],
		references: [vendorProfiles.id],
	}),
	servicePackage: one(servicePackages, {
		fields: [bookings.servicePackageId],
		references: [servicePackages.id],
	}),
}));
