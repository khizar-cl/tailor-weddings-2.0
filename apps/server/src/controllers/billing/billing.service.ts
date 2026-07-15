import { ORPCError } from "@orpc/server";
import type {
	StripeRedirectSchema,
	SubscriptionStatus,
	SubscriptionTier,
	VendorSubscriptionSchema,
} from "@repo/shared";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, stripeEvents, subscriptions, vendorAccounts } from "../../db";
import { env } from "../../utils/env";
import { logger } from "../../utils/logger";
import { getStripe, isStripeConfigured } from "../../utils/stripe";

const appUrl = env.CORS_ORIGIN[0] ?? "http://localhost:3001";
const MEMBERSHIP_PATH = "/portal/vendor/membership";

function requireStripe(): Stripe {
	if (!isStripeConfigured()) {
		throw new ORPCError("FORBIDDEN", {
			message: "Billing is not available right now.",
		});
	}
	return getStripe();
}

async function getAccount(dbUserId: number) {
	const account = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.userId, dbUserId),
		columns: { id: true, subscriptionTier: true, stripeCustomerId: true },
		with: { user: { columns: { email: true, name: true } } },
	});
	if (!account) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor account not found" });
	}
	return account;
}

type VendorAccount = Awaited<ReturnType<typeof getAccount>>;

/** The account's Stripe customer id, creating (and persisting) it on first use. */
async function ensureCustomer(
	stripe: Stripe,
	account: VendorAccount,
	dbUserId: number,
): Promise<string> {
	if (account.stripeCustomerId) return account.stripeCustomerId;
	const customer = await stripe.customers.create({
		email: account.user?.email,
		name: account.user?.name ?? undefined,
		metadata: { vendorAccountId: String(account.id) },
	});
	await db
		.update(vendorAccounts)
		.set({
			stripeCustomerId: customer.id,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(vendorAccounts.id, account.id));
	return customer.id;
}

export async function getSubscription(
	dbUserId: number,
): Promise<VendorSubscriptionSchema> {
	const account = await getAccount(dbUserId);
	const sub = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.vendorAccountId, account.id),
		columns: { status: true, currentPeriodEnd: true },
	});
	return {
		tier: account.subscriptionTier,
		status: sub?.status ?? null,
		currentPeriodEnd: sub?.currentPeriodEnd ?? null,
	};
}

export async function createCheckoutSession(
	dbUserId: number,
): Promise<StripeRedirectSchema> {
	const stripe = requireStripe();
	const priceId = env.STRIPE_PRICE_PRO;
	if (!priceId) {
		throw new ORPCError("FORBIDDEN", {
			message: "Billing is not available right now.",
		});
	}
	const account = await getAccount(dbUserId);
	const customerId = await ensureCustomer(stripe, account, dbUserId);

	const session = await stripe.checkout.sessions.create({
		customer: customerId,
		mode: "subscription",
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: `${appUrl}${MEMBERSHIP_PATH}?checkout=success`,
		cancel_url: `${appUrl}${MEMBERSHIP_PATH}?checkout=cancelled`,
	});
	if (!session.url) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to start checkout",
		});
	}
	return { url: session.url };
}

export async function createPortalSession(
	dbUserId: number,
): Promise<StripeRedirectSchema> {
	const stripe = requireStripe();
	const account = await getAccount(dbUserId);
	if (!account.stripeCustomerId) {
		throw new ORPCError("CONFLICT", {
			message: "Start a subscription before managing billing.",
		});
	}
	const session = await stripe.billingPortal.sessions.create({
		customer: account.stripeCustomerId,
		return_url: `${appUrl}${MEMBERSHIP_PATH}`,
	});
	return { url: session.url };
}

// -- Webhook mirroring (called from the verified Stripe webhook route) --

const STATUS_MAP: Record<string, SubscriptionStatus> = {
	active: "active",
	trialing: "trialing",
	past_due: "past_due",
	unpaid: "canceled",
	canceled: "canceled",
	incomplete: "past_due",
	incomplete_expired: "canceled",
	paused: "past_due",
};

function mapStatus(status: string): SubscriptionStatus {
	return STATUS_MAP[status] ?? "past_due";
}

/** Single paid tier: any live subscription is "pro"; a dead one drops to "free". */
function tierFor(status: SubscriptionStatus): SubscriptionTier {
	return status === "canceled" ? "free" : "pro";
}

/** Billing-period end moved onto items in newer Stripe API versions; read both. */
function periodEnd(sub: Stripe.Subscription): Date | null {
	const shape = sub as unknown as {
		current_period_end?: number | null;
		items?: { data?: Array<{ current_period_end?: number | null }> };
	};
	const unix =
		shape.current_period_end ?? shape.items?.data?.[0]?.current_period_end;
	return unix ? new Date(unix * 1000) : null;
}

async function applySubscription(sub: Stripe.Subscription) {
	const customerId =
		typeof sub.customer === "string" ? sub.customer : sub.customer.id;
	const account = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.stripeCustomerId, customerId),
		columns: { id: true },
	});
	if (!account) {
		logger.warn({ customerId }, "Stripe subscription for unknown customer");
		return;
	}

	const status = mapStatus(sub.status);
	const tier = tierFor(status);
	const now = new Date();

	await db
		.insert(subscriptions)
		.values({
			vendorAccountId: account.id,
			stripeSubscriptionId: sub.id,
			tier,
			status,
			currentPeriodEnd: periodEnd(sub),
		})
		.onConflictDoUpdate({
			target: subscriptions.vendorAccountId,
			set: {
				stripeSubscriptionId: sub.id,
				tier,
				status,
				currentPeriodEnd: periodEnd(sub),
				updatedAt: now,
			},
		});

	await db
		.update(vendorAccounts)
		.set({ subscriptionTier: tier, updatedAt: now })
		.where(eq(vendorAccounts.id, account.id));
}

/**
 * Apply a signature-verified Stripe event to local state. Idempotent: the
 * unique `stripe_events` row means a retried delivery is a no-op.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
	const [recorded] = await db
		.insert(stripeEvents)
		.values({ stripeEventId: event.id, type: event.type })
		.onConflictDoNothing({ target: stripeEvents.stripeEventId })
		.returning({ id: stripeEvents.id });
	if (!recorded) {
		logger.info(
			{ eventId: event.id },
			"Stripe event already processed — skipping",
		);
		return;
	}

	switch (event.type) {
		case "customer.subscription.created":
		case "customer.subscription.updated":
		case "customer.subscription.deleted":
			await applySubscription(event.data.object);
			break;
		default:
			break;
	}
}
