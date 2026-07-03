import { relations } from "drizzle-orm";
import {
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { subscriptionTierEnum } from "./enums.schema";
import { vendorAccounts } from "./vendor-account.schema";

// Paired with SubscriptionStatusEnum in packages/shared/src/models/vendor.types.ts.
export const subscriptionStatusEnum = pgEnum("subscription_status", [
	"trialing",
	"active",
	"past_due",
	"canceled",
]);

/**
 * A vendor account's Stripe subscription — a local mirror of Stripe state,
 * written only by the Stripe webhook. One per vendor account.
 */
export const subscriptions = pgTable("subscriptions", {
	id: serial("id").primaryKey(),
	uuid: uuid("uuid").notNull().unique().defaultRandom(),
	vendorAccountId: integer("vendor_account_id")
		.notNull()
		.unique()
		.references(() => vendorAccounts.id),
	stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
	tier: subscriptionTierEnum("tier").notNull(),
	status: subscriptionStatusEnum("status").notNull(),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
	...auditColumns(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	vendorAccount: one(vendorAccounts, {
		fields: [subscriptions.vendorAccountId],
		references: [vendorAccounts.id],
	}),
}));
