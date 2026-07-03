import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { vendorProfiles } from "./vendor-profile.schema";
import { weddings } from "./wedding.schema";

// Paired with RecommendationStatusEnum in packages/shared/src/models/review.types.ts.
export const recommendationStatusEnum = pgEnum("recommendation_status", [
	"suggested",
	"accepted",
	"dismissed",
]);

/**
 * A vendor suggested to a couple by the (rule-based) planner. Kept separate
 * from bookings/saved vendors so acceptance can be measured directly (the AI
 * recommendation acceptance-rate KPI). matchScore is the rule score; rationale
 * is a templated explanation of why it matched.
 */
export const vendorRecommendations = pgTable(
	"vendor_recommendations",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorProfileId: integer("vendor_profile_id")
			.notNull()
			.references(() => vendorProfiles.id),
		matchScore: integer("match_score"),
		rationale: text("rationale"),
		status: recommendationStatusEnum("status").notNull().default("suggested"),
		...auditColumns(),
	},
	(table) => [
		unique("vendor_recommendations_wedding_vendor_uniq").on(
			table.weddingId,
			table.vendorProfileId,
		),
		index("vendor_recommendations_wedding_id_idx").on(table.weddingId),
		index("vendor_recommendations_vendor_profile_id_idx").on(
			table.vendorProfileId,
		),
	],
);

export const vendorRecommendationsRelations = relations(
	vendorRecommendations,
	({ one }) => ({
		wedding: one(weddings, {
			fields: [vendorRecommendations.weddingId],
			references: [weddings.id],
		}),
		vendorProfile: one(vendorProfiles, {
			fields: [vendorRecommendations.vendorProfileId],
			references: [vendorProfiles.id],
		}),
	}),
);
