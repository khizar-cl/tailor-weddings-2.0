import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../tests/factories";
import {
	createTestApp,
	withAuth,
} from "../../../tests/helpers/app.test-helper";
import { truncateTables } from "../../../tests/helpers/db.test-helper";
import { db } from "../../db/db";
import {
	stripeEvents,
	subscriptions,
	users,
	vendorAccounts,
} from "../../db/schema";
import { isStripeConfigured } from "../../utils/stripe";
import { handleStripeEvent } from "./billing.service";

// Control Stripe availability explicitly so these tests don't depend on whether
// the developer happens to have STRIPE_* set in their local .env.
vi.mock("../../utils/stripe", () => ({
	isStripeConfigured: vi.fn(() => false),
	getStripe: vi.fn(() => ({}) as never),
}));
const mockConfigured = vi.mocked(isStripeConfigured);

const app = createTestApp();

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

/** POST an oRPC call (no-input procedures included), optionally authenticated. */
function call(path: string, clerkId?: string) {
	const base = request(app).post(path);
	return clerkId ? withAuth(base, clerkId) : withAuth(base);
}

async function seedVendorAccount(key: string, stripeCustomerId?: string) {
	const [user] = await db
		.insert(users)
		.values({
			clerkId: `vendor_${key}`,
			email: `vendor_${key}@example.com`,
			name: `Vendor ${key}`,
		})
		.returning({ id: users.id });
	if (!user) throw new Error("Failed to seed vendor user");
	const [account] = await db
		.insert(vendorAccounts)
		.values({ userId: user.id, stripeCustomerId: stripeCustomerId ?? null })
		.returning({ id: vendorAccounts.id });
	if (!account) throw new Error("Failed to seed vendor account");
	return { clerkId: `vendor_${key}`, accountId: account.id };
}

/** A minimal Stripe subscription event, shaped for `handleStripeEvent`. */
function subscriptionEvent(
	id: string,
	type: string,
	sub: { id: string; customer: string; status: string; periodEnd?: number },
): Stripe.Event {
	return {
		id,
		type,
		data: {
			object: {
				id: sub.id,
				customer: sub.customer,
				status: sub.status,
				current_period_end: sub.periodEnd,
				items: { data: [] },
			},
		},
	} as unknown as Stripe.Event;
}

async function tierOf(accountId: number) {
	const row = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.id, accountId),
		columns: { subscriptionTier: true },
	});
	return row?.subscriptionTier;
}

beforeEach(async () => {
	mockConfigured.mockReturnValue(false);
	await createTestUser({ preferences: {} });
});

afterEach(async () => {
	await truncateTables(users, stripeEvents);
});

describe("billing.getSubscription", () => {
	it("404s for a user without a vendor account", async () => {
		const res = await call("/rpc/billing/getSubscription");
		expect(res.status).toBe(404);
	});

	it("returns the free tier with no status by default", async () => {
		const vendor = await seedVendorAccount("free");
		const body = rpcBody(
			await call("/rpc/billing/getSubscription", vendor.clerkId).expect(200),
		);
		expect(body.tier).toBe("free");
		expect(body.status).toBeNull();
		expect(body.currentPeriodEnd).toBeNull();
	});
});

describe("billing checkout & portal", () => {
	it("403s checkout when Stripe is not configured", async () => {
		const vendor = await seedVendorAccount("nocfg");
		const res = await call(
			"/rpc/billing/createCheckoutSession",
			vendor.clerkId,
		);
		expect(res.status).toBe(403);
	});

	it("409s on portal when the vendor has no Stripe customer yet", async () => {
		mockConfigured.mockReturnValue(true);
		// Configured, but this vendor never checked out, so there's no customer to
		// send to the portal — the customer check fires before any Stripe call.
		const vendor = await seedVendorAccount("noportal");
		const res = await call("/rpc/billing/createPortalSession", vendor.clerkId);
		expect(res.status).toBe(409);
	});
});

describe("stripe webhook mirroring", () => {
	it("mirrors an active subscription to pro and dedupes retries", async () => {
		const vendor = await seedVendorAccount("hook", "cus_hook_1");

		await handleStripeEvent(
			subscriptionEvent("evt_1", "customer.subscription.created", {
				id: "sub_1",
				customer: "cus_hook_1",
				status: "active",
				periodEnd: 1_900_000_000,
			}),
		);
		expect(await tierOf(vendor.accountId)).toBe("pro");
		const sub = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.vendorAccountId, vendor.accountId),
			columns: { status: true, tier: true, currentPeriodEnd: true },
		});
		expect(sub?.status).toBe("active");
		expect(sub?.tier).toBe("pro");
		expect(sub?.currentPeriodEnd).not.toBeNull();

		// Same event id, different payload → ignored (idempotency guard).
		await handleStripeEvent(
			subscriptionEvent("evt_1", "customer.subscription.updated", {
				id: "sub_1",
				customer: "cus_hook_1",
				status: "canceled",
			}),
		);
		expect(await tierOf(vendor.accountId)).toBe("pro");

		// A fresh cancellation event drops the tier back to free.
		await handleStripeEvent(
			subscriptionEvent("evt_2", "customer.subscription.deleted", {
				id: "sub_1",
				customer: "cus_hook_1",
				status: "canceled",
			}),
		);
		expect(await tierOf(vendor.accountId)).toBe("free");
	});

	it("ignores subscription events for unknown customers", async () => {
		await handleStripeEvent(
			subscriptionEvent("evt_unknown", "customer.subscription.created", {
				id: "sub_x",
				customer: "cus_does_not_exist",
				status: "active",
			}),
		);
		const sub = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.stripeSubscriptionId, "sub_x"),
		});
		expect(sub).toBeUndefined();
	});
});
