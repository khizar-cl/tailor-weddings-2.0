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
	budgetItems,
	categories,
	checklistItems,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorRecommendations,
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

async function seedCategory(slug = "photography", name = "Photography") {
	const [row] = await db
		.insert(categories)
		.values({ slug, name })
		.returning({ uuid: categories.uuid });
	if (!row) throw new Error("Failed to seed category");
	return row.uuid;
}

/** Seed a published vendor business offering `categorySlug` in `region`. */
async function seedPublishedVendor(region: string, categorySlug: string) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, categorySlug),
		columns: { id: true },
	});
	if (!category) throw new Error("Seed the category before the vendor");

	const [vendorUser] = await db
		.insert(users)
		.values({
			clerkId: `vendor_${categorySlug}`,
			email: `vendor_${categorySlug}@example.com`,
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
			businessName: "Test Vendor Studio",
			region,
			isVerified: true,
		})
		.returning({ id: vendorBusinesses.id });
	if (!business) throw new Error("Failed to seed vendor business");

	await db.insert(vendorServices).values({
		vendorBusinessId: business.id,
		categoryId: category.id,
		isPublished: true,
		isPrimary: true,
	});
	return business.id;
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("user.me identity", () => {
	it("exposes derived capabilities and defaults for a fresh user", async () => {
		const res = await withAuth(request(app).post("/rpc/user/me")).expect(200);
		const body = rpcBody(res);

		expect(body.capabilities).toEqual({ isCouple: false, isVendor: false });
		expect(body.activeMode).toBe("couple");
		expect(body.onboarding).toEqual({ couple: false, vendor: false });
	});
});

describe("user.setActiveMode", () => {
	it("rejects switching to a mode the user lacks", async () => {
		const res = await rpc("/rpc/user/setActiveMode", { mode: "vendor" });
		expect(res.status).toBe(403);
	});
});

describe("auth.addCapability", () => {
	it("provisions the vendor side and switches active mode", async () => {
		const res = await rpc("/rpc/auth/addCapability", {
			capability: "vendor",
		}).expect(200);
		const body = rpcBody(res);

		expect(body.capabilities.isVendor).toBe(true);
		expect(body.activeMode).toBe("vendor");
	});
});

describe("onboarding.submitCouple", () => {
	it("persists the wedding and completes couple onboarding", async () => {
		const res = await rpc("/rpc/onboarding/submitCouple", {
			estimatedBudgetCents: 3_500_000,
			guestCountEstimate: 120,
			city: "Austin",
			region: "Texas",
			styleTags: ["Modern", "Garden"],
			stylePalette: ["#A21C3B"],
		}).expect(200);
		const body = rpcBody(res);

		expect(body.capabilities.isCouple).toBe(true);
		expect(body.onboarding.couple).toBe(true);

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, "test@example.com"));
		if (!user) throw new Error("Test user not found");
		const wedding = await db.query.weddings.findFirst({
			where: eq(weddings.ownerUserId, user.id),
		});
		expect(wedding?.city).toBe("Austin");
		expect(wedding?.estimatedBudgetCents).toBe(3_500_000);
		expect(wedding?.styleTags).toEqual(["Modern", "Garden"]);
		if (!wedding) throw new Error("Wedding not found");

		const checklist = await db.query.checklistItems.findMany({
			where: eq(checklistItems.weddingId, wedding.id),
		});
		expect(checklist.length).toBeGreaterThan(0);
		expect(checklist.every((item) => item.source === "generated")).toBe(true);

		const budget = await db.query.budgetItems.findMany({
			where: eq(budgetItems.weddingId, wedding.id),
		});
		expect(budget.length).toBeGreaterThan(0);
		const totalEstimated = budget.reduce(
			(sum, line) => sum + (line.estimatedCents ?? 0),
			0,
		);
		// The allocation splits ~100% of the couple's budget (rounding aside).
		expect(totalEstimated).toBeGreaterThan(3_400_000);
		expect(totalEstimated).toBeLessThanOrEqual(3_500_000);
	});

	it("regenerates generated tasks but keeps the couple's manual tasks on re-run", async () => {
		const first = await rpc("/rpc/onboarding/submitCouple", {
			estimatedBudgetCents: 3_500_000,
			guestCountEstimate: 120,
			city: "Austin",
			region: "Texas",
			styleTags: ["Modern"],
			stylePalette: [],
		}).expect(200);
		expect(first.status).toBe(200);

		const addRes = await rpc("/rpc/checklist/addTask", {
			title: "Taste-test the cake",
		}).expect(200);
		const manualUuid = rpcBody(addRes).uuid;

		await rpc("/rpc/onboarding/submitCouple", {
			estimatedBudgetCents: 3_500_000,
			guestCountEstimate: 120,
			city: "Austin",
			region: "Texas",
			styleTags: ["Garden"],
			stylePalette: [],
		}).expect(200);

		const listRes = await withAuth(
			request(app).post("/rpc/checklist/list"),
		).expect(200);
		const items: Array<{ uuid: string; source: string }> =
			rpcBody(listRes).items;

		// The manual task survives regeneration; generated tasks are replaced once.
		expect(items.some((i) => i.uuid === manualUuid)).toBe(true);
		const generated = items.filter((i) => i.source === "generated");
		const generatedUuids = new Set(generated.map((i) => i.uuid));
		expect(generatedUuids.size).toBe(generated.length);
	});

	it("buckets past-due tasks into 'Start now' when the wedding is close", async () => {
		// Wedding ~3 months out: long-lead tasks (venue, photographer, etc.)
		// would fall in the past.
		const weddingDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

		await rpc("/rpc/onboarding/submitCouple", {
			weddingDate: weddingDate.toISOString(),
			estimatedBudgetCents: 3_500_000,
			guestCountEstimate: 120,
			city: "Austin",
			region: "Texas",
			styleTags: ["Modern"],
			stylePalette: [],
		}).expect(200);

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, "test@example.com"));
		if (!user) throw new Error("Test user not found");
		const wedding = await db.query.weddings.findFirst({
			where: eq(weddings.ownerUserId, user.id),
		});
		if (!wedding) throw new Error("Wedding not found");

		const checklist = await db.query.checklistItems.findMany({
			where: eq(checklistItems.weddingId, wedding.id),
		});
		// No generated task is left with a past due date...
		expect(
			checklist.every(
				(item) => item.dueDate === null || item.dueDate.getTime() > Date.now(),
			),
		).toBe(true);
		// ...and the long-lead ones are collapsed to no due date (shown as "start now").
		expect(checklist.some((item) => item.dueDate === null)).toBe(true);
	});

	it("generates vendor recommendations from published businesses in the region", async () => {
		await seedCategory("photography", "Photography");
		const businessId = await seedPublishedVendor("Texas", "photography");

		await rpc("/rpc/onboarding/submitCouple", {
			estimatedBudgetCents: 3_500_000,
			guestCountEstimate: 120,
			city: "Austin",
			region: "Texas",
			styleTags: ["Modern"],
			stylePalette: [],
		}).expect(200);

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, "test@example.com"));
		if (!user) throw new Error("Test user not found");
		const wedding = await db.query.weddings.findFirst({
			where: eq(weddings.ownerUserId, user.id),
		});
		if (!wedding) throw new Error("Wedding not found");

		const recs = await db.query.vendorRecommendations.findMany({
			where: eq(vendorRecommendations.weddingId, wedding.id),
		});
		expect(recs).toHaveLength(1);
		expect(recs[0]?.vendorBusinessId).toBe(businessId);
		// region + verified bonuses on top of the base score.
		expect(recs[0]?.matchScore).toBe(100);
		expect(recs[0]?.categoryId).not.toBeNull();
	});
});

describe("onboarding.submitVendor", () => {
	it("creates one business with a primary draft service and completes vendor onboarding", async () => {
		const categoryUuid = await seedCategory();

		const res = await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuids: [categoryUuid],
			region: "Texas",
		}).expect(200);
		const body = rpcBody(res);

		expect(body.capabilities.isVendor).toBe(true);
		expect(body.onboarding.vendor).toBe(true);

		const business = await db.query.vendorBusinesses.findFirst({
			where: eq(vendorBusinesses.businessName, "Vance Studio"),
		});
		expect(business?.region).toBe("Texas");
		if (!business) throw new Error("Business not created");

		const services = await db.query.vendorServices.findMany({
			where: eq(vendorServices.vendorBusinessId, business.id),
		});
		expect(services).toHaveLength(1);
		expect(services[0]?.isPublished).toBe(false);
		expect(services[0]?.isPrimary).toBe(true);
	});

	it("rejects an unknown category", async () => {
		const res = await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuids: ["00000000-0000-0000-0000-000000000000"],
			region: "Texas",
		});
		expect(res.status).toBe(404);
	});

	it("rejects more services than the free tier allows", async () => {
		const first = await seedCategory("photography", "Photography");
		const second = await seedCategory("videography", "Videography");

		const res = await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuids: [first, second],
			region: "Texas",
		});
		expect(res.status).toBe(403);
	});

	it("updates the existing business on re-run instead of creating a duplicate", async () => {
		const categoryUuid = await seedCategory();

		await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuids: [categoryUuid],
			region: "Texas",
		}).expect(200);

		await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Photography",
			categoryUuids: [categoryUuid],
			region: "California",
			city: "Los Angeles",
			tagline: "Timeless wedding photography",
		}).expect(200);

		const businesses = await db.query.vendorBusinesses.findMany();
		expect(businesses).toHaveLength(1);
		expect(businesses[0]?.businessName).toBe("Vance Photography");
		expect(businesses[0]?.region).toBe("California");
		expect(businesses[0]?.city).toBe("Los Angeles");
		expect(businesses[0]?.tagline).toBe("Timeless wedding photography");
	});

	it("swaps services on re-run, soft-deleting the de-selected one", async () => {
		const photography = await seedCategory("photography", "Photography");
		const videography = await seedCategory("videography", "Videography");

		await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuids: [photography],
			region: "Texas",
		}).expect(200);

		await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuids: [videography],
			region: "Texas",
		}).expect(200);

		const business = await db.query.vendorBusinesses.findFirst({
			where: eq(vendorBusinesses.businessName, "Vance Studio"),
		});
		if (!business) throw new Error("Business not created");

		const services = await db.query.vendorServices.findMany({
			where: eq(vendorServices.vendorBusinessId, business.id),
		});
		const live = services.filter((s) => s.deletedAt === null);
		const removed = services.filter((s) => s.deletedAt !== null);
		expect(services).toHaveLength(2);
		expect(live).toHaveLength(1);
		expect(removed).toHaveLength(1);
		expect(live[0]?.isPrimary).toBe(true);

		const cats = await db.query.categories.findMany({
			columns: { id: true, slug: true },
		});
		const idBySlug = new Map(cats.map((c) => [c.slug, c.id]));
		expect(live[0]?.categoryId).toBe(idBySlug.get("videography"));
		expect(removed[0]?.categoryId).toBe(idBySlug.get("photography"));
	});

	it("revives a previously removed service instead of duplicating it", async () => {
		const photography = await seedCategory("photography", "Photography");
		const videography = await seedCategory("videography", "Videography");

		const submit = (categoryUuid: string) =>
			rpc("/rpc/onboarding/submitVendor", {
				businessName: "Vance Studio",
				categoryUuids: [categoryUuid],
				region: "Texas",
			}).expect(200);

		await submit(photography); // add photography
		await submit(videography); // remove photography, add videography
		await submit(photography); // revive photography, remove videography

		const business = await db.query.vendorBusinesses.findFirst({
			where: eq(vendorBusinesses.businessName, "Vance Studio"),
		});
		if (!business) throw new Error("Business not created");

		const services = await db.query.vendorServices.findMany({
			where: eq(vendorServices.vendorBusinessId, business.id),
		});
		// Only two rows — photography is revived, not inserted a second time.
		expect(services).toHaveLength(2);
		const live = services.filter((s) => s.deletedAt === null);
		expect(live).toHaveLength(1);

		const cats = await db.query.categories.findMany({
			columns: { id: true, slug: true },
		});
		const idBySlug = new Map(cats.map((c) => [c.slug, c.id]));
		expect(live[0]?.categoryId).toBe(idBySlug.get("photography"));
	});
});
