import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { files } from "./files.schema";
import { vendorAccounts } from "./vendor-account.schema";
import { vendorServices } from "./vendor-service.schema";

/**
 * A vendor's single public-facing business, one per vendor account. The
 * services it offers (each a taxonomy category or a custom label) live in
 * vendor_services, and publishing is per-service. Reviews and verification
 * attach here, at the business level.
 */
export const vendorBusinesses = pgTable(
	"vendor_businesses",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorAccountId: integer("vendor_account_id")
			.notNull()
			.unique()
			.references(() => vendorAccounts.id),
		businessName: text("business_name").notNull(),
		tagline: text("tagline"),
		bio: text("bio"),
		logoFileId: integer("logo_file_id").references(() => files.id),
		website: text("website"),
		city: text("city"),
		region: text("region"),
		yearsInBusiness: integer("years_in_business"),
		isVerified: boolean("is_verified").notNull().default(false),
		verifiedAt: timestamp("verified_at", { withTimezone: true }),
		...auditColumns(),
	},
	(table) => [index("vendor_businesses_region_idx").on(table.region)],
);

export const vendorBusinessesRelations = relations(
	vendorBusinesses,
	({ one, many }) => ({
		account: one(vendorAccounts, {
			fields: [vendorBusinesses.vendorAccountId],
			references: [vendorAccounts.id],
		}),
		logo: one(files, {
			fields: [vendorBusinesses.logoFileId],
			references: [files.id],
		}),
		services: many(vendorServices),
	}),
);
