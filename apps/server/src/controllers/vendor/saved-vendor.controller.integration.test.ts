import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../tests/factories";
import {
	createTestApp,
	withAuth,
} from "../../../tests/helpers/app.test-helper";
import { truncateTables } from "../../../tests/helpers/db.test-helper";
import { db } from "../../db/db";
import {
	categories,
	savedVendors,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
} from "../../db/schema";

const app = createTestApp();

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

function rpc(path: string, input: unknown) {
	return withAuth(request(app).post(path))
		.set("Content-Type", "application/json")
		.send(JSON.stringify({ json: input }));
}

async function onboardCouple() {
	await rpc("/rpc/onboarding/submitCouple", {
		estimatedBudgetCents: 3_500_000,
		guestCountEstimate: 120,
		city: "Austin",
		region: "Texas",
		styleTags: ["Modern"],
		stylePalette: [],
	}).expect(200);
}

/** Seed a business with one primary photography service; return its uuid. */
async function seedVendorUuid(key: string) {
	const [vendorUser] = await db
		.insert(users)
		.values({
			clerkId: `vendor_${key}`,
			email: `vendor_${key}@example.com`,
			name: "Test Vendor",
		})
		.returning({ id: users.id });
	if (!vendorUser) throw new Error("Failed to seed vendor user");
	const [account] = await db
		.insert(vendorAccounts)
		.values({ userId: vendorUser.id })
		.returning({ id: vendorAccounts.id });
	if (!account) throw new Error("Failed to seed vendor account");
	const [business] = await db
		.insert(vendorBusinesses)
		.values({
			vendorAccountId: account.id,
			businessName: `Studio ${key}`,
			region: "Texas",
			isVerified: true,
		})
		.returning({ id: vendorBusinesses.id, uuid: vendorBusinesses.uuid });
	if (!business) throw new Error("Failed to seed vendor business");
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, "photography"),
		columns: { id: true },
	});
	if (!category) throw new Error("Category not seeded");
	await db.insert(vendorServices).values({
		vendorBusinessId: business.id,
		categoryId: category.id,
		isPublished: true,
		isPrimary: true,
		startingPriceCents: 300_000,
	});
	return business.uuid;
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
	await db
		.insert(categories)
		.values({ slug: "photography", name: "Photography" });
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("savedVendor", () => {
	it("requires a wedding to save", async () => {
		const uuid = await seedVendorUuid("no-wedding");
		const res = await rpc("/rpc/savedVendor/save", {
			vendorBusinessUuid: uuid,
		});
		expect(res.status).toBe(404);
	});

	it("saves a vendor and lists it with its primary category", async () => {
		await onboardCouple();
		const uuid = await seedVendorUuid("saved");

		const saved = rpcBody(
			await rpc("/rpc/savedVendor/save", {
				vendorBusinessUuid: uuid,
				notes: "Loved their portfolio",
			}).expect(200),
		);
		expect(saved.vendorBusinessUuid).toBe(uuid);
		expect(saved.primaryCategoryName).toBe("Photography");
		expect(saved.notes).toBe("Loved their portfolio");

		const list = rpcBody(await rpc("/rpc/savedVendor/list", {}).expect(200));
		expect(list.items).toHaveLength(1);
		expect(list.items[0].businessName).toBe("Studio saved");
		expect(list.items[0].isVerified).toBe(true);
	});

	it("returns 404 when saving an unknown vendor", async () => {
		await onboardCouple();
		const res = await rpc("/rpc/savedVendor/save", {
			vendorBusinessUuid: "00000000-0000-0000-0000-000000000000",
		});
		expect(res.status).toBe(404);
	});

	it("unsaves a vendor and can re-save it afterwards", async () => {
		await onboardCouple();
		const uuid = await seedVendorUuid("toggle");

		await rpc("/rpc/savedVendor/save", { vendorBusinessUuid: uuid }).expect(
			200,
		);
		const removed = rpcBody(
			await rpc("/rpc/savedVendor/unsave", {
				vendorBusinessUuid: uuid,
			}).expect(200),
		);
		expect(removed.removed).toBe(true);
		expect(
			rpcBody(await rpc("/rpc/savedVendor/list", {}).expect(200)).items,
		).toHaveLength(0);

		// Re-saving revives the same soft-deleted row (no unique-constraint clash).
		await rpc("/rpc/savedVendor/save", { vendorBusinessUuid: uuid }).expect(
			200,
		);
		const list = rpcBody(await rpc("/rpc/savedVendor/list", {}).expect(200));
		expect(list.items).toHaveLength(1);

		// Exactly one physical row exists — the revive was an upsert, not a new insert.
		const rows = await db.select({ id: savedVendors.id }).from(savedVendors);
		expect(rows).toHaveLength(1);
	});

	it("reports removed=false when unsaving a vendor that was never saved", async () => {
		await onboardCouple();
		const uuid = await seedVendorUuid("never");
		const res = rpcBody(
			await rpc("/rpc/savedVendor/unsave", {
				vendorBusinessUuid: uuid,
			}).expect(200),
		);
		expect(res.removed).toBe(false);
	});
});
