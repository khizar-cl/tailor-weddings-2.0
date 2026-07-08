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
	users,
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

async function seedCategory(slug = "photography", name = "Photography") {
	const [row] = await db
		.insert(categories)
		.values({ slug, name })
		.returning({ uuid: categories.uuid });
	if (!row) throw new Error("Failed to seed category");
	return row.uuid;
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
