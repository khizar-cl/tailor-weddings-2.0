import express, { type Express } from "express";
import { handleStripeEvent } from "../controllers/billing/billing.service";
import { env } from "../utils/env";
import { logger } from "../utils/logger";
import { getStripe, isStripeConfigured } from "../utils/stripe";

/**
 * Stripe webhook. Mounted with a raw body parser (not the JSON stream oRPC
 * reads) because signature verification needs the exact bytes Stripe sent.
 * Must be registered before the oRPC catch-all.
 */
export function mountStripeWebhook(app: Express) {
	app.post(
		"/webhooks/stripe",
		express.raw({ type: "application/json" }),
		async (req, res) => {
			if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
				res.status(503).json({ error: "Billing not configured" });
				return;
			}
			const signature = req.headers["stripe-signature"];
			if (typeof signature !== "string") {
				res.status(400).json({ error: "Missing signature" });
				return;
			}

			let event: ReturnType<
				ReturnType<typeof getStripe>["webhooks"]["constructEvent"]
			>;
			try {
				event = getStripe().webhooks.constructEvent(
					req.body,
					signature,
					env.STRIPE_WEBHOOK_SECRET,
				);
			} catch (err) {
				logger.warn({ err }, "Stripe webhook signature verification failed");
				res.status(400).json({ error: "Invalid signature" });
				return;
			}

			try {
				await handleStripeEvent(event);
			} catch (err) {
				logger.error(
					{ err, eventId: event.id },
					"Stripe webhook handling failed",
				);
				res.status(500).json({ error: "Webhook handling failed" });
				return;
			}
			res.json({ received: true });
		},
	);
}
