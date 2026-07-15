import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

/**
 * Billing is enabled only when the secret key, webhook secret, and pro price
 * are all set — the `billing` API and webhook stay inert otherwise, so the app
 * runs locally without Stripe.
 */
export function isStripeConfigured(): boolean {
	return Boolean(
		env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_PRO,
	);
}

/** Lazily-created Stripe client. Throws if the secret key isn't configured. */
export function getStripe(): Stripe {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error("Stripe is not configured (STRIPE_SECRET_KEY unset).");
	}
	if (!client) {
		client = new Stripe(env.STRIPE_SECRET_KEY);
	}
	return client;
}
