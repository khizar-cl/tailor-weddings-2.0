import { pgEnum } from "drizzle-orm/pg-core";

// Enums used by more than one schema file live here; single-use enums are
// colocated with the table that uses them.
//
// pgEnum requires literal arrays for proper Drizzle column type inference
// (deriving values from a Zod enum's `.options` widens the column type to
// `string` and breaks downstream narrowing). The values here MUST stay aligned
// with their paired Zod enums in packages/shared/src/models — this is a paired
// source-of-truth declaration (DB schema + runtime validation).

// vendor_accounts + subscriptions
export const subscriptionTierEnum = pgEnum("subscription_tier", [
	"free",
	"pro",
]);

// checklist_items + budget_items
export const contentSourceEnum = pgEnum("content_source", [
	"generated",
	"manual",
	"booking",
]);

// reviews + review_requests
export const reviewTypeEnum = pgEnum("review_type", ["peer", "client"]);

// vendor_services + service_packages
export const priceUnitEnum = pgEnum("price_unit", [
	"flat",
	"hourly",
	"per_guest",
]);
