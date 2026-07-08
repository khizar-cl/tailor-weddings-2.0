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
import { vendorServices } from "./vendor-service.schema";

/**
 * An ordered portfolio image on a vendor service. The binary lives in S3 via
 * the files table; this row is the association + display metadata. How many a
 * service may hold is gated by the account's tier (a per-service cap).
 */
export const portfolioMedia = pgTable(
	"portfolio_media",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		vendorServiceId: integer("vendor_service_id")
			.notNull()
			.references(() => vendorServices.id),
		fileId: integer("file_id")
			.notNull()
			.references(() => files.id),
		caption: text("caption"),
		sortOrder: integer("sort_order").notNull().default(0),
		...auditColumns(),
	},
	(table) => [
		index("portfolio_media_vendor_service_id_idx").on(table.vendorServiceId),
		index("portfolio_media_file_id_idx").on(table.fileId),
	],
);

export const portfolioMediaRelations = relations(portfolioMedia, ({ one }) => ({
	vendorService: one(vendorServices, {
		fields: [portfolioMedia.vendorServiceId],
		references: [vendorServices.id],
	}),
	file: one(files, {
		fields: [portfolioMedia.fileId],
		references: [files.id],
	}),
}));
