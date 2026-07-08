import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { reviewTypeEnum } from "./enums.schema";
import { users } from "./users.schema";
import { vendorBusinesses } from "./vendor-business.schema";
import { weddings } from "./wedding.schema";

// Paired with ReviewRequestStatusEnum in packages/shared/src/models/review.types.ts.
export const reviewRequestStatusEnum = pgEnum("review_request_status", [
	"sent",
	"completed",
	"expired",
]);

/**
 * A post-event prompt asking a user to review a vendor they were booked
 * alongside. The verification anchor for the trust system: a review can only
 * be submitted against a request, and requests are only generated for parties
 * with a confirmed booking on the same wedding. `token` links the submission.
 */
export const reviewRequests = pgTable(
	"review_requests",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		subjectVendorBusinessId: integer("subject_vendor_business_id")
			.notNull()
			.references(() => vendorBusinesses.id),
		targetUserId: integer("target_user_id")
			.notNull()
			.references(() => users.id),
		type: reviewTypeEnum("type").notNull(),
		token: uuid("token").notNull().unique().defaultRandom(),
		status: reviewRequestStatusEnum("status").notNull().default("sent"),
		sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		...auditColumns(),
	},
	(table) => [
		index("review_requests_target_user_id_idx").on(table.targetUserId),
		index("review_requests_subject_vendor_business_id_idx").on(
			table.subjectVendorBusinessId,
		),
		index("review_requests_wedding_id_idx").on(table.weddingId),
	],
);

export const reviewRequestsRelations = relations(reviewRequests, ({ one }) => ({
	wedding: one(weddings, {
		fields: [reviewRequests.weddingId],
		references: [weddings.id],
	}),
	subjectVendorBusiness: one(vendorBusinesses, {
		fields: [reviewRequests.subjectVendorBusinessId],
		references: [vendorBusinesses.id],
	}),
	targetUser: one(users, {
		fields: [reviewRequests.targetUserId],
		references: [users.id],
	}),
}));
