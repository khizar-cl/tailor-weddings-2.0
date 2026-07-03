import { relations } from "drizzle-orm";
import {
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
import { users } from "./users.schema";

// Paired with WeddingStatusEnum in packages/shared/src/models/wedding.types.ts.
export const weddingStatusEnum = pgEnum("wedding_status", [
	"planning",
	"complete",
]);

/**
 * A couple's wedding — the root of all planning data. Two users may be
 * associated: the owner has write access, the partner has read-only access, so
 * planning stays conflict-free with a single writer. Access is enforced in the
 * service layer (only ownerUserId passes the write check).
 *
 * styleTags are descriptive vibe keywords used for vendor matching;
 * stylePalette is the wedding's hex color scheme (presentational only).
 */
export const weddings = pgTable(
	"weddings",
	{
		id: serial("id").primaryKey(),
		uuid: uuid("uuid").notNull().unique().defaultRandom(),
		ownerUserId: integer("owner_user_id")
			.notNull()
			.references(() => users.id),
		partnerUserId: integer("partner_user_id").references(() => users.id),
		weddingDate: timestamp("wedding_date", { withTimezone: true }),
		estimatedBudgetCents: integer("estimated_budget_cents"),
		guestCountEstimate: integer("guest_count_estimate"),
		city: text("city"),
		region: text("region"),
		styleTags: jsonb("style_tags").$type<string[]>().notNull().default([]),
		stylePalette: jsonb("style_palette")
			.$type<string[]>()
			.notNull()
			.default([]),
		onboardingAnswers:
			jsonb("onboarding_answers").$type<Record<string, unknown>>(),
		status: weddingStatusEnum("status").notNull().default("planning"),
		...auditColumns(),
	},
	(table) => [
		unique("weddings_owner_user_id_uniq").on(table.ownerUserId),
		index("weddings_partner_user_id_idx").on(table.partnerUserId),
		index("weddings_wedding_date_idx").on(table.weddingDate),
	],
);

export const weddingsRelations = relations(weddings, ({ one }) => ({
	owner: one(users, {
		fields: [weddings.ownerUserId],
		references: [users.id],
		relationName: "weddings_owner",
	}),
	partner: one(users, {
		fields: [weddings.partnerUserId],
		references: [users.id],
		relationName: "weddings_partner",
	}),
}));
