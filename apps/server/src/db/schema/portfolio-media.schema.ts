import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { files } from "./files.schema";
import { vendorProfiles } from "./vendor-profile.schema";

/**
 * An ordered portfolio image on a vendor profile. The binary lives in S3 via
 * the existing files table; this row is the association + display metadata.
 * How many a profile may hold is gated by the account's tier.
 */
export const portfolioMedia = pgTable(
	"portfolio_media",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorProfileId: integer("vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		fileId: integer("file_id")
			.notNull()
			.references(() => files.id),
		caption: text("caption"),
		sortOrder: integer("sort_order").notNull().default(0),
		...auditColumns(),
	},
	(table) => [
		index("portfolio_media_vendor_profile_id_idx").on(table.vendorProfileId),
		index("portfolio_media_file_id_idx").on(table.fileId),
	],
);

export const portfolioMediaRelations = relations(portfolioMedia, ({ one }) => ({
	vendorProfile: one(vendorProfiles, {
		fields: [portfolioMedia.vendorProfileId],
		references: [vendorProfiles.id],
	}),
	file: one(files, {
		fields: [portfolioMedia.fileId],
		references: [files.id],
	}),
}));
