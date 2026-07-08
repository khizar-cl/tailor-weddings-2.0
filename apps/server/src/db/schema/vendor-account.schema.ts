import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns } from "./_shared";
import { subscriptionTierEnum } from "./enums.schema";
import { users } from "./users.schema";
import { vendorBusinesses } from "./vendor-business.schema";

/**
 * Billing container for a vendor, one per vendor user. Holds the Stripe
 * customer and the subscription tier that gates the vendor's business and its
 * services. Kept separate from vendor_businesses so billing state is isolated
 * from the public listing and can exist before onboarding creates the business.
 */
export const vendorAccounts = pgTable("vendor_accounts", {
	id: serial("id").primaryKey(),
	uuid: uuid("uuid").notNull().unique().defaultRandom(),
	userId: integer("user_id")
		.notNull()
		.unique()
		.references(() => users.id),
	subscriptionTier: subscriptionTierEnum("subscription_tier")
		.notNull()
		.default("free"),
	stripeCustomerId: text("stripe_customer_id"),
	...auditColumns(),
});

export const vendorAccountsRelations = relations(vendorAccounts, ({ one }) => ({
	user: one(users, {
		fields: [vendorAccounts.userId],
		references: [users.id],
	}),
	business: one(vendorBusinesses),
}));
