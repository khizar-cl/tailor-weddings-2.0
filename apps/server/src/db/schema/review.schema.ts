import { relations, sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { reviewTypeEnum } from "./enums.schema";
import { reviewRequests } from "./review-request.schema";
import { users } from "./users.schema";
import { vendorProfiles } from "./vendor-profile.schema";
import { weddings } from "./wedding.schema";

// Paired with ReviewStatusEnum in packages/shared/src/models/review.types.ts.
export const reviewStatusEnum = pgEnum("review_status", [
	"pending",
	"published",
	"rejected",
	"flagged",
]);

/**
 * A verified review of a vendor. `type` is peer (vendor→vendor) or client
 * (couple→vendor). Tied to the review request that authorized it and to the
 * wedding the collaboration happened on. `ratings` holds the structured
 * breakdown (professionalism, communication, quality); overallRating is 1–5.
 */
export const reviews = pgTable(
	"reviews",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		reviewRequestId: integer("review_request_id").references(
			() => reviewRequests.id,
		),
		type: reviewTypeEnum("type").notNull(),
		authorUserId: integer("author_user_id")
			.notNull()
			.references(() => users.id),
		authorVendorProfileId: integer("author_vendor_profile_id").references(
			() => vendorProfiles.id,
		),
		subjectVendorProfileId: integer("subject_vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		overallRating: integer("overall_rating").notNull(),
		ratings: jsonb("ratings").$type<Record<string, number>>(),
		body: text("body"),
		status: reviewStatusEnum("status").notNull().default("pending"),
		verifiedAt: timestamp("verified_at", { withTimezone: true }),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		...auditColumns(),
	},
	(table) => [
		unique("reviews_author_subject_wedding_uniq").on(
			table.authorUserId,
			table.subjectVendorProfileId,
			table.weddingId,
		),
		index("reviews_subject_status_idx").on(
			table.subjectVendorProfileId,
			table.status,
		),
		check(
			"reviews_overall_rating_chk",
			sql`${table.overallRating} between 1 and 5`,
		),
	],
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
	reviewRequest: one(reviewRequests, {
		fields: [reviews.reviewRequestId],
		references: [reviewRequests.id],
	}),
	author: one(users, {
		fields: [reviews.authorUserId],
		references: [users.id],
	}),
	authorVendorProfile: one(vendorProfiles, {
		fields: [reviews.authorVendorProfileId],
		references: [vendorProfiles.id],
		relationName: "reviews_author_vendor",
	}),
	subjectVendorProfile: one(vendorProfiles, {
		fields: [reviews.subjectVendorProfileId],
		references: [vendorProfiles.id],
		relationName: "reviews_subject_vendor",
	}),
	wedding: one(weddings, {
		fields: [reviews.weddingId],
		references: [weddings.id],
	}),
}));
