import type {
	SubscriptionTier,
	VendorProfileServiceSchema,
} from "@repo/shared";
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
	files,
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

let testUserId: number;

/** Give the auth'd user a vendor account + business with one primary service. */
async function setupVendor(tier: SubscriptionTier = "pro", withLogo = false) {
	const [account] = await db
		.insert(vendorAccounts)
		.values({ userId: testUserId, subscriptionTier: tier })
		.returning({ id: vendorAccounts.id });
	if (!account) throw new Error("Failed to seed vendor account");

	let logoFileId: number | undefined;
	if (withLogo) {
		const [logo] = await db
			.insert(files)
			.values({
				key: "uploads/test/logo.png",
				bucket: "file-uploads",
				fileName: "logo.png",
				contentType: "image/png",
				sizeBytes: 1024,
				createdBy: testUserId,
				updatedBy: testUserId,
			})
			.returning({ id: files.id });
		logoFileId = logo?.id;
	}

	const [business] = await db
		.insert(vendorBusinesses)
		.values({
			vendorAccountId: account.id,
			businessName: "Studio Test",
			region: "Texas",
			logoFileId: logoFileId ?? null,
		})
		.returning({ id: vendorBusinesses.id, uuid: vendorBusinesses.uuid });
	if (!business) throw new Error("Failed to seed vendor business");
	const [service] = await db
		.insert(vendorServices)
		.values({
			vendorBusinessId: business.id,
			categoryId: await categoryId("photography"),
			isPrimary: true,
			isPublished: false,
		})
		.returning({ uuid: vendorServices.uuid });
	if (!service) throw new Error("Failed to seed vendor service");
	return { businessUuid: business.uuid, serviceUuid: service.uuid };
}

function findService(
	body: { services: VendorProfileServiceSchema[] },
	uuid: string,
) {
	return body.services.find((s) => s.uuid === uuid);
}

beforeEach(async () => {
	const user = await createTestUser({ preferences: {} });
	testUserId = user.id;
	await db.insert(categories).values([
		{ slug: "photography", name: "Photography" },
		{ slug: "floral", name: "Floral" },
	]);
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("vendorProfile.get", () => {
	it("returns 404 when the caller has no vendor business", async () => {
		const res = await withAuth(request(app).post("/rpc/vendorProfile/get"));
		expect(res.status).toBe(404);
	});

	it("returns the business, its services, and the tier limits", async () => {
		const { serviceUuid } = await setupVendor("pro");
		const body = rpcBody(
			await withAuth(request(app).post("/rpc/vendorProfile/get")).expect(200),
		);

		expect(body.businessName).toBe("Studio Test");
		expect(body.tier).toBe("pro");
		expect(body.limits.maxServices).toBe(10);
		expect(body.services).toHaveLength(1);
		expect(findService(body, serviceUuid)?.isPrimary).toBe(true);
		expect(findService(body, serviceUuid)?.categoryName).toBe("Photography");
	});
});

describe("vendorProfile.updateBusiness", () => {
	it("updates editable business fields", async () => {
		await setupVendor();
		const body = rpcBody(
			await rpc("/rpc/vendorProfile/updateBusiness", {
				businessName: "Atelier Lumen",
				region: "California",
				bio: "Fine-art photography.",
				website: "atelierlumen.com",
				yearsInBusiness: 8,
			}).expect(200),
		);

		expect(body.businessName).toBe("Atelier Lumen");
		expect(body.region).toBe("California");
		expect(body.bio).toBe("Fine-art photography.");
		expect(body.website).toBe("atelierlumen.com");
		expect(body.yearsInBusiness).toBe(8);
	});
});

describe("vendorProfile.addService", () => {
	it("adds a taxonomy service with no starting price until packaged", async () => {
		await setupVendor("pro");
		const body = rpcBody(
			await rpc("/rpc/vendorProfile/addService", {
				categoryUuid: await categoryUuidBySlug("floral"),
				description: "Bespoke florals for your day.",
			}).expect(200),
		);
		expect(body.services).toHaveLength(2);
		const floral = body.services.find(
			(s: { categoryName: string | null }) => s.categoryName === "Floral",
		);
		expect(floral.startingPriceCents).toBeNull();
		expect(floral.description).toBe("Bespoke florals for your day.");
		expect(floral.isPublished).toBe(false);
	});

	it("adds a custom service that is pending and unpublishable", async () => {
		await setupVendor("pro");
		const body = rpcBody(
			await rpc("/rpc/vendorProfile/addService", {
				customLabel: "Balloon artistry",
				description: "Whimsical balloon installations.",
			}).expect(200),
		);
		const custom = body.services.find(
			(s: { customLabel: string | null }) =>
				s.customLabel === "Balloon artistry",
		);
		expect(custom.isPending).toBe(true);
		expect(custom.categoryUuid).toBeNull();

		// A custom service cannot be published.
		const publish = await rpc("/rpc/vendorProfile/setServicePublish", {
			serviceUuid: custom.uuid,
			isPublished: true,
		});
		expect(publish.status).toBe(403);
	});

	it("rejects a duplicate taxonomy service", async () => {
		await setupVendor("pro");
		const res = await rpc("/rpc/vendorProfile/addService", {
			categoryUuid: await categoryUuidBySlug("photography"),
			description: "Duplicate photography service.",
		});
		expect(res.status).toBe(409);
	});

	it("enforces the tier service cap", async () => {
		await setupVendor("free");
		const res = await rpc("/rpc/vendorProfile/addService", {
			categoryUuid: await categoryUuidBySlug("floral"),
			description: "Florals beyond the plan limit.",
		});
		expect(res.status).toBe(403);
	});
});

describe("vendorProfile service state", () => {
	it("requires a logo before a service can be published", async () => {
		const { serviceUuid } = await setupVendor("pro", false);
		const res = await rpc("/rpc/vendorProfile/setServicePublish", {
			serviceUuid,
			isPublished: true,
		});
		expect(res.status).toBe(403);
	});

	it("publishes and unpublishes a taxonomy service", async () => {
		const { serviceUuid } = await setupVendor("pro", true);
		let body = rpcBody(
			await rpc("/rpc/vendorProfile/setServicePublish", {
				serviceUuid,
				isPublished: true,
			}).expect(200),
		);
		expect(findService(body, serviceUuid)?.isPublished).toBe(true);

		body = rpcBody(
			await rpc("/rpc/vendorProfile/setServicePublish", {
				serviceUuid,
				isPublished: false,
			}).expect(200),
		);
		expect(findService(body, serviceUuid)?.isPublished).toBe(false);
	});

	it("moves the primary flag to the chosen service", async () => {
		const { serviceUuid: photoUuid } = await setupVendor("pro");
		const added = rpcBody(
			await rpc("/rpc/vendorProfile/addService", {
				categoryUuid: await categoryUuidBySlug("floral"),
				description: "Bespoke florals for your day.",
			}).expect(200),
		);
		const floral = added.services.find(
			(s: { categoryName: string | null }) => s.categoryName === "Floral",
		);

		const body = rpcBody(
			await rpc("/rpc/vendorProfile/setServicePrimary", {
				serviceUuid: floral.uuid,
			}).expect(200),
		);
		expect(findService(body, floral.uuid)?.isPrimary).toBe(true);
		expect(findService(body, photoUuid)?.isPrimary).toBe(false);
	});

	it("removes a service and reassigns primary to a survivor", async () => {
		const { serviceUuid: photoUuid } = await setupVendor("pro");
		const added = rpcBody(
			await rpc("/rpc/vendorProfile/addService", {
				categoryUuid: await categoryUuidBySlug("floral"),
				description: "Bespoke florals for your day.",
			}).expect(200),
		);
		const floral = added.services.find(
			(s: { categoryName: string | null }) => s.categoryName === "Floral",
		);

		const body = rpcBody(
			await rpc("/rpc/vendorProfile/removeService", {
				serviceUuid: photoUuid,
			}).expect(200),
		);
		expect(body.services).toHaveLength(1);
		expect(findService(body, floral.uuid)?.isPrimary).toBe(true);
	});
});

describe("vendorProfile packages", () => {
	it("adds, updates, and removes a package", async () => {
		const { serviceUuid } = await setupVendor();

		let body = rpcBody(
			await rpc("/rpc/vendorProfile/addPackage", {
				serviceUuid,
				name: "Full day",
				description: "Dawn-to-last-dance coverage.",
				priceCents: 500_000,
				priceUnit: "flat",
			}).expect(200),
		);
		const created = findService(body, serviceUuid)?.packages[0];
		expect(created?.name).toBe("Full day");
		expect(created?.priceCents).toBe(500_000);
		// Starting price is inferred from the (only) package.
		expect(findService(body, serviceUuid)?.startingPriceCents).toBe(500_000);
		const packageUuid = created?.uuid;

		body = rpcBody(
			await rpc("/rpc/vendorProfile/updatePackage", {
				packageUuid,
				name: "Full day + album",
				description: "Full coverage plus a heirloom album.",
				priceCents: 650_000,
				priceUnit: "flat",
			}).expect(200),
		);
		const updated = findService(body, serviceUuid)?.packages[0];
		expect(updated?.name).toBe("Full day + album");
		expect(updated?.priceCents).toBe(650_000);
		expect(findService(body, serviceUuid)?.startingPriceCents).toBe(650_000);

		body = rpcBody(
			await rpc("/rpc/vendorProfile/removePackage", {
				packageUuid,
			}).expect(200),
		);
		expect(findService(body, serviceUuid)?.packages).toHaveLength(0);
		// With no packages left, the starting price clears.
		expect(findService(body, serviceUuid)?.startingPriceCents).toBeNull();
	});

	it("infers the starting price from the cheapest package", async () => {
		const { serviceUuid } = await setupVendor();
		await rpc("/rpc/vendorProfile/addPackage", {
			serviceUuid,
			name: "Premium",
			description: "The works.",
			priceCents: 900_000,
			priceUnit: "flat",
		}).expect(200);
		const body = rpcBody(
			await rpc("/rpc/vendorProfile/addPackage", {
				serviceUuid,
				name: "Essential",
				description: "The essentials.",
				priceCents: 400_000,
				priceUnit: "flat",
			}).expect(200),
		);
		expect(findService(body, serviceUuid)?.startingPriceCents).toBe(400_000);
	});
});
