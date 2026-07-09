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
	reviews,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
	weddings,
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

async function categoryId(slug: string) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, slug),
		columns: { id: true },
	});
	if (!category) throw new Error(`Category ${slug} not seeded`);
	return category.id;
}

async function categoryUuidBySlug(slug: string) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, slug),
		columns: { uuid: true },
	});
	if (!category) throw new Error(`Category ${slug} not seeded`);
	return category.uuid;
}

interface SeedVendorOptions {
	key: string;
	businessName?: string;
	region?: string;
	isVerified?: boolean;
	categorySlug?: string;
	customLabel?: string;
	isPublished?: boolean;
	startingPriceCents?: number;
}

/** Seed a vendor business with a single service and return the business id. */
async function seedVendor(opts: SeedVendorOptions) {
	const [vendorUser] = await db
		.insert(users)
		.values({
			clerkId: `vendor_${opts.key}`,
			email: `vendor_${opts.key}@example.com`,
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
			businessName: opts.businessName ?? `Studio ${opts.key}`,
			region: opts.region ?? "Texas",
			isVerified: opts.isVerified ?? false,
		})
		.returning({ id: vendorBusinesses.id });
	if (!business) throw new Error("Failed to seed vendor business");

	await db.insert(vendorServices).values({
		vendorBusinessId: business.id,
		categoryId: opts.categorySlug ? await categoryId(opts.categorySlug) : null,
		customLabel: opts.customLabel ?? null,
		isPublished: opts.isPublished ?? true,
		isPrimary: true,
		startingPriceCents: opts.startingPriceCents ?? 300_000,
	});
	return business.id;
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
	await db.insert(categories).values([
		{ slug: "photography", name: "Photography" },
		{ slug: "floral", name: "Floral" },
	]);
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("vendor.search", () => {
	it("lists only businesses with a published taxonomy service", async () => {
		await seedVendor({ key: "published", categorySlug: "photography" });
		await seedVendor({
			key: "unpublished",
			categorySlug: "floral",
			isPublished: false,
		});
		await seedVendor({ key: "custom", customLabel: "Balloon artistry" });

		const res = await rpc("/rpc/vendor/search", {}).expect(200);
		const body = rpcBody(res);

		expect(body.total).toBe(1);
		expect(body.items).toHaveLength(1);
		expect(body.items[0].businessName).toBe("Studio published");
		expect(body.items[0].featuredService.categoryUuid).toBe(
			await categoryUuidBySlug("photography"),
		);
		expect(body.items[0].fromPriceCents).toBe(300_000);
	});

	it("filters by category and region", async () => {
		await seedVendor({
			key: "tx-photo",
			categorySlug: "photography",
			region: "Texas",
		});
		await seedVendor({
			key: "ny-photo",
			categorySlug: "photography",
			region: "New York",
		});
		await seedVendor({
			key: "tx-floral",
			categorySlug: "floral",
			region: "Texas",
		});

		const photographyUuid = await categoryUuidBySlug("photography");
		const byCategory = rpcBody(
			await rpc("/rpc/vendor/search", {
				categoryUuid: photographyUuid,
			}).expect(200),
		);
		expect(byCategory.total).toBe(2);

		const byRegion = rpcBody(
			await rpc("/rpc/vendor/search", {
				categoryUuid: photographyUuid,
				region: "Texas",
			}).expect(200),
		);
		expect(byRegion.total).toBe(1);
		expect(byRegion.items[0].businessName).toBe("Studio tx-photo");
	});

	it("orders verified businesses first and reflects saved + rating state", async () => {
		const plainId = await seedVendor({
			key: "plain",
			businessName: "Aaa Studio",
			categorySlug: "photography",
			isVerified: false,
		});
		await seedVendor({
			key: "verified",
			businessName: "Zzz Studio",
			categorySlug: "photography",
			isVerified: true,
		});
		await onboardCouple();

		// A published client review on the unverified business.
		const [couple] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, "test@example.com"));
		if (!couple) throw new Error("Couple user missing");
		const wedding = await db.query.weddings.findFirst({
			where: eq(weddings.ownerUserId, couple.id),
			columns: { id: true },
		});
		if (!wedding) throw new Error("Wedding missing");
		await db.insert(reviews).values({
			type: "client",
			authorUserId: couple.id,
			subjectVendorBusinessId: plainId,
			weddingId: wedding.id,
			overallRating: 4,
			status: "published",
		});

		await rpc("/rpc/savedVendor/save", {
			vendorBusinessUuid: (
				await db.query.vendorBusinesses.findFirst({
					where: eq(vendorBusinesses.id, plainId),
					columns: { uuid: true },
				})
			)?.uuid,
		}).expect(200);

		const body = rpcBody(await rpc("/rpc/vendor/search", {}).expect(200));
		expect(
			body.items.map((v: { businessName: string }) => v.businessName),
		).toEqual(["Zzz Studio", "Aaa Studio"]);
		const plain = body.items.find(
			(v: { businessName: string }) => v.businessName === "Aaa Studio",
		);
		expect(plain.rating).toEqual({ average: 4, count: 1 });
		expect(plain.isSaved).toBe(true);
	});
});

describe("vendor.getByUuid", () => {
	it("returns 404 for an unknown vendor", async () => {
		const res = await rpc("/rpc/vendor/getByUuid", {
			uuid: "00000000-0000-0000-0000-000000000000",
		});
		expect(res.status).toBe(404);
	});

	it("returns the business with published services and rating aggregates", async () => {
		const businessId = await seedVendor({
			key: "detail",
			categorySlug: "photography",
			startingPriceCents: 250_000,
		});
		const business = await db.query.vendorBusinesses.findFirst({
			where: eq(vendorBusinesses.id, businessId),
			columns: { uuid: true },
		});
		if (!business) throw new Error("Business missing");
		await onboardCouple();

		const [couple] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, "test@example.com"));
		if (!couple) throw new Error("Couple user missing");
		const wedding = await db.query.weddings.findFirst({
			where: eq(weddings.ownerUserId, couple.id),
			columns: { id: true },
		});
		if (!wedding) throw new Error("Wedding missing");
		await db.insert(reviews).values({
			type: "peer",
			authorUserId: couple.id,
			subjectVendorBusinessId: businessId,
			weddingId: wedding.id,
			overallRating: 5,
			status: "published",
		});

		const body = rpcBody(
			await rpc("/rpc/vendor/getByUuid", { uuid: business.uuid }).expect(200),
		);

		expect(body.businessName).toBe("Studio detail");
		expect(body.services).toHaveLength(1);
		expect(body.services[0].categoryUuid).toBe(
			await categoryUuidBySlug("photography"),
		);
		expect(body.services[0].startingPriceCents).toBe(250_000);
		expect(body.rating).toEqual({ average: 5, count: 1 });
		expect(body.peerEndorsementCount).toBe(1);
	});
});
