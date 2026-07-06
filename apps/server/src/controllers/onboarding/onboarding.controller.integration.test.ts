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
import { categories, users, vendorProfiles, weddings } from "../../db/schema";

const app = createTestApp();

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

function rpc(path: string, input: unknown) {
	return withAuth(request(app).post(path))
		.set("Content-Type", "application/json")
		.send(JSON.stringify({ json: input }));
}

async function seedCategory() {
	const [row] = await db
		.insert(categories)
		.values({ slug: "photography", name: "Photography" })
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
	it("creates an unpublished draft profile and completes vendor onboarding", async () => {
		const categoryUuid = await seedCategory();

		const res = await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuid,
			region: "Texas",
		}).expect(200);
		const body = rpcBody(res);

		expect(body.capabilities.isVendor).toBe(true);
		expect(body.onboarding.vendor).toBe(true);

		const profile = await db.query.vendorProfiles.findFirst({
			where: eq(vendorProfiles.businessName, "Vance Studio"),
		});
		expect(profile?.isPublished).toBe(false);
		expect(profile?.region).toBe("Texas");
	});

	it("rejects an unknown category", async () => {
		const res = await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuid: "00000000-0000-0000-0000-000000000000",
			region: "Texas",
		});
		expect(res.status).toBe(404);
	});

	it("updates the existing draft on re-run instead of creating a duplicate", async () => {
		const categoryUuid = await seedCategory();

		await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Studio",
			categoryUuid,
			region: "Texas",
		}).expect(200);

		await rpc("/rpc/onboarding/submitVendor", {
			businessName: "Vance Photography",
			categoryUuid,
			region: "California",
			city: "Los Angeles",
			tagline: "Timeless wedding photography",
		}).expect(200);

		const profiles = await db.query.vendorProfiles.findMany();
		expect(profiles).toHaveLength(1);
		expect(profiles[0]?.businessName).toBe("Vance Photography");
		expect(profiles[0]?.region).toBe("California");
		expect(profiles[0]?.city).toBe("Los Angeles");
		expect(profiles[0]?.tagline).toBe("Timeless wedding photography");
	});
});
