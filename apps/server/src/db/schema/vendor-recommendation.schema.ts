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
import { categories } from "./category.schema";
import { vendorBusinesses } from "./vendor-business.schema";
import { weddings } from "./wedding.schema";

// Paired with RecommendationStatusEnum in packages/shared/src/models/review.types.ts.
export const recommendationStatusEnum = pgEnum("recommendation_status", [
	"suggested",
	"accepted",
	"dismissed",
]);

/**
 * A vendor business suggested to a couple by the (rule-based) planner. Kept
 * separate from bookings/saved vendors so acceptance can be measured directly
 * (the AI recommendation acceptance-rate KPI). categoryId records which service
 * the match is for; matchScore is the rule score; rationale is a templated
 * explanation of why it matched.
 */
export const vendorRecommendations = pgTable(
	"vendor_recommendations",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		weddingId: integer("wedding_id")
			.notNull()
			.references(() => weddings.id),
		vendorBusinessId: integer("vendor_business_id")
			.notNull()
			.references(() => vendorBusinesses.id),
		categoryId: integer("category_id").references(() => categories.id),
		matchScore: integer("match_score"),
		rationale: text("rationale"),
		status: recommendationStatusEnum("status").notNull().default("suggested"),
		...auditColumns(),
	},
	(table) => [
		unique("vendor_recommendations_wedding_vendor_uniq").on(
			table.weddingId,
			table.vendorBusinessId,
		),
		index("vendor_recommendations_wedding_id_idx").on(table.weddingId),
		index("vendor_recommendations_vendor_business_id_idx").on(
			table.vendorBusinessId,
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
		vendorBusiness: one(vendorBusinesses, {
			fields: [vendorRecommendations.vendorBusinessId],
			references: [vendorBusinesses.id],
		}),
		category: one(categories, {
			fields: [vendorRecommendations.categoryId],
			references: [categories.id],
		}),
	}),
);
