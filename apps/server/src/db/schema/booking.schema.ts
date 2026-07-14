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
import { weddings } from "./wedding.schema";

// Paired with BookingStatusEnum in packages/shared/src/models/wedding.types.ts.
export const bookingStatusEnum = pgEnum("booking_status", [
	"pending",
	"confirmed",
	"cancelled",
]);

/**
 * A confirmed engagement between a wedding and a single vendor package — the
 * "real" team. Requested by the couple (pending) and accepted by the vendor
 * (confirmed). Booking is per package, so a couple can book several packages
 * from one service (or business) independently; the service and business are
 * reachable through the package. vendorBusinessId is denormalized off the
 * package's service for business-level roster/gate queries. Confirmed bookings
 * drive budget auto-population and are the verified-collaboration proof that
 * gates peer reviews.
 */
export const bookings = pgTable(
	"bookings",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorBusinessId: integer("vendor_business_id")
			.notNull()
			.references(() => vendorBusinesses.id),
		servicePackageId: integer("service_package_id")
			.notNull()
			.references(() => servicePackages.id),
		status: bookingStatusEnum("status").notNull().default("pending"),
		bookedAt: timestamp("booked_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		...auditColumns(),
	},
	(table) => [
		unique("bookings_wedding_package_uniq").on(
			table.weddingId,
			table.servicePackageId,
		),
		index("bookings_wedding_id_idx").on(table.weddingId),
		index("bookings_service_package_id_idx").on(table.servicePackageId),
		index("bookings_vendor_business_id_idx").on(table.vendorBusinessId),
	],
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
	wedding: one(weddings, {
		fields: [bookings.weddingId],
		references: [weddings.id],
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
