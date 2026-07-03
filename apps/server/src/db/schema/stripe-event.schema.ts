import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Idempotency guard for Stripe webhooks. The unique stripeEventId lets a
 * retried webhook be recognized as already-processed so side effects (grants,
 * subscription state changes) never run twice.
 */
export const stripeEvents = pgTable("stripe_events", {
	id: serial("id").primaryKey(),
	stripeEventId: text("stripe_event_id").notNull().unique(),
	type: text("type").notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
