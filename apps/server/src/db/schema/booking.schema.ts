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
import { vendorBusinesses } from "./vendor-business.schema";
import { vendorServices } from "./vendor-service.schema";
import { weddings } from "./wedding.schema";

// Paired with BookingStatusEnum in packages/shared/src/models/wedding.types.ts.
export const bookingStatusEnum = pgEnum("booking_status", [
	"pending",
	"confirmed",
	"cancelled",
]);

/**
 * A confirmed engagement between a wedding and a single vendor service — the
 * "real" team. Requested by the couple (pending) and accepted by the vendor
 * (confirmed). Booking is per service, so a couple can book one business for
 * several of its services independently; vendorBusinessId is denormalized off
 * the service for business-level roster/gate queries. Confirmed bookings drive
 * budget auto-population and are the verified-collaboration proof that gates
 * peer reviews.
 */
export const bookings = pgTable(
	"bookings",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorServiceId: integer("vendor_service_id")
			.notNull()
			.references(() => vendorServices.id),
		vendorBusinessId: integer("vendor_business_id")
			.notNull()
			.references(() => vendorBusinesses.id),
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
		unique("bookings_wedding_service_uniq").on(
			table.weddingId,
			table.vendorServiceId,
		),
		index("bookings_wedding_id_idx").on(table.weddingId),
		index("bookings_vendor_service_id_idx").on(table.vendorServiceId),
		index("bookings_vendor_business_id_idx").on(table.vendorBusinessId),
	],
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
	wedding: one(weddings, {
		fields: [bookings.weddingId],
		references: [weddings.id],
	}),
	vendorService: one(vendorServices, {
		fields: [bookings.vendorServiceId],
		references: [vendorServices.id],
	}),
	vendorBusiness: one(vendorBusinesses, {
		fields: [bookings.vendorBusinessId],
		references: [vendorBusinesses.id],
	}),
	servicePackage: one(servicePackages, {
		fields: [bookings.servicePackageId],
		references: [servicePackages.id],
	}),
}));
