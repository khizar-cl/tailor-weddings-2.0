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
import { categories } from "./category.schema";
import { files } from "./files.schema";
import { portfolioMedia } from "./portfolio-media.schema";
import { servicePackages } from "./service-package.schema";
import { vendorAccounts } from "./vendor-account.schema";

/**
 * A public-facing vendor listing for a single service category. A vendor
 * account may own several (e.g. one Photography profile and one Videography
 * profile); how many can be published is gated by the account's tier.
 */
export const vendorProfiles = pgTable(
	"vendor_profiles",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorAccountId: integer("vendor_account_id")
			.notNull()
			.references(() => vendorAccounts.id),
		categoryId: integer("category_id")
			.notNull()
			.references(() => categories.id),
		businessName: text("business_name").notNull(),
		tagline: text("tagline"),
		bio: text("bio"),
		logoFileId: integer("logo_file_id").references(() => files.id),
		website: text("website"),
		city: text("city"),
		region: text("region"),
		yearsInBusiness: integer("years_in_business"),
		isPublished: boolean("is_published").notNull().default(false),
		...auditColumns(),
	},
	(table) => [
		index("vendor_profiles_vendor_account_id_idx").on(table.vendorAccountId),
		index("vendor_profiles_category_id_idx").on(table.categoryId),
		index("vendor_profiles_region_idx").on(table.region),
		index("vendor_profiles_is_published_idx").on(table.isPublished),
	],
);

export const vendorProfilesRelations = relations(
	vendorProfiles,
	({ one, many }) => ({
		account: one(vendorAccounts, {
			fields: [vendorProfiles.vendorAccountId],
			references: [vendorAccounts.id],
		}),
		category: one(categories, {
			fields: [vendorProfiles.categoryId],
			references: [categories.id],
		}),
		logo: one(files, {
			fields: [vendorProfiles.logoFileId],
			references: [files.id],
		}),
		packages: many(servicePackages),
		portfolio: many(portfolioMedia),
	}),
);
