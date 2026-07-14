import { and, eq, isNull } from "drizzle-orm";
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
	servicePackages,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
	weddings,
} from "../../db/schema";

const app = createTestApp();

/** Well-formed v4 UUID that never matches a seeded row. */
const MISSING_UUID = "3f0e6b2a-1c4d-4e5f-8a9b-0c1d2e3f4a5b";

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

/** POST an oRPC call, optionally authenticated as a specific Clerk user. */
function rpc(path: string, input: unknown, clerkId?: string) {
	const base = request(app).post(path);
	return (clerkId ? withAuth(base, clerkId) : withAuth(base))
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

async function ownedWeddingId() {
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, "test@example.com"));
	if (!user) throw new Error("Test user not found");
	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.ownerUserId, user.id),
		columns: { id: true },
	});
	if (!wedding) throw new Error("Wedding not found");
	return wedding.id;
}

/** Add a published service (by category slug) + one package to a business. */
async function seedService(
	businessId: number,
	slug: string,
	priceCents: number,
	isPrimary: boolean,
) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, slug),
		columns: { id: true },
	});
	if (!category) throw new Error(`Category ${slug} not seeded`);
	const [service] = await db
		.insert(vendorServices)
		.values({
			vendorBusinessId: businessId,
			categoryId: category.id,
			isPublished: true,
			isPrimary,
		})
		.returning({ uuid: vendorServices.uuid, id: vendorServices.id });
	if (!service) throw new Error("Failed to seed vendor service");
	const [pkg] = await db
		.insert(servicePackages)
		.values({
			vendorServiceId: service.id,
			name: `${slug} package`,
			priceCents,
		})
		.returning({ uuid: servicePackages.uuid });
	if (!pkg) throw new Error("Failed to seed package");
	return { serviceUuid: service.uuid, packageUuid: pkg.uuid };
}

/** A vendor business with a primary photography service (+ package). */
async function seedVendor(key: string) {
	const [vendorUser] = await db
		.insert(users)
		.values({
			clerkId: `vendor_${key}`,
			email: `vendor_${key}@example.com`,
			name: `Vendor ${key}`,
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
		})
		.returning({ id: vendorBusinesses.id, uuid: vendorBusinesses.uuid });
	if (!business) throw new Error("Failed to seed vendor business");
	const photo = await seedService(business.id, "photography", 450_000, true);
	return {
		vendorClerkId: `vendor_${key}`,
		businessId: business.id,
		businessUuid: business.uuid,
		serviceUuid: photo.serviceUuid,
		packageUuid: photo.packageUuid,
	};
}

async function liveBookingBudgetLines(weddingId: number) {
	return db.query.budgetItems.findMany({
		where: and(
			eq(budgetItems.weddingId, weddingId),
			eq(budgetItems.source, "booking"),
			isNull(budgetItems.deletedAt),
		),
		columns: { label: true, estimatedCents: true, category: true },
	});
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
	await db.insert(categories).values([
		{ slug: "photography", name: "Photography" },
		{ slug: "videography", name: "Videography" },
	]);
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("booking.request", () => {
	it("requires a wedding to request a booking", async () => {
		const vendor = await seedVendor("no-wedding");
		const res = await rpc("/rpc/booking/request", {
			vendorServiceUuid: vendor.serviceUuid,
		});
		expect(res.status).toBe(404);
	});

	it("creates a pending booking the couple can see", async () => {
		await onboardCouple();
		const vendor = await seedVendor("req");

		const booking = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
				servicePackageUuid: vendor.packageUuid,
			}).expect(200),
		);
		expect(booking.status).toBe("pending");
		expect(booking.counterpartyKind).toBe("vendor");
		expect(booking.title).toBe("Studio req");
		expect(booking.serviceLabel).toBe("Photography");
		expect(booking.packageName).toBe("photography package");
		expect(booking.confirmedAt).toBeNull();
	});

	it("is idempotent — re-requesting a service reuses the same booking", async () => {
		await onboardCouple();
		const vendor = await seedVendor("dupe");
		const first = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
			}).expect(200),
		);
		const second = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
			}).expect(200),
		);
		expect(second.uuid).toBe(first.uuid);
	});

	it("books two services of one vendor as separate bookings", async () => {
		await onboardCouple();
		const vendor = await seedVendor("multi");
		const video = await seedService(
			vendor.businessId,
			"videography",
			300_000,
			false,
		);

		const photo = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
			}).expect(200),
		);
		const film = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: video.serviceUuid,
			}).expect(200),
		);
		expect(film.uuid).not.toBe(photo.uuid);
		expect(photo.serviceLabel).toBe("Photography");
		expect(film.serviceLabel).toBe("Videography");

		const forWedding = rpcBody(
			await rpc("/rpc/booking/listForWedding", {}).expect(200),
		);
		expect(forWedding.items).toHaveLength(2);
	});

	it("returns 404 for an unpublished service", async () => {
		await onboardCouple();
		const vendor = await seedVendor("hidden");
		await db
			.update(vendorServices)
			.set({ isPublished: false })
			.where(eq(vendorServices.uuid, vendor.serviceUuid));
		const res = await rpc("/rpc/booking/request", {
			vendorServiceUuid: vendor.serviceUuid,
		});
		expect(res.status).toBe(404);
	});
});

describe("booking.confirm", () => {
	it("confirms a request and auto-populates the couple's budget", async () => {
		await onboardCouple();
		const weddingId = await ownedWeddingId();
		const vendor = await seedVendor("confirm");

		const requested = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
				servicePackageUuid: vendor.packageUuid,
			}).expect(200),
		);

		const confirmed = rpcBody(
			await rpc(
				"/rpc/booking/confirm",
				{ bookingUuid: requested.uuid },
				vendor.vendorClerkId,
			).expect(200),
		);
		expect(confirmed.status).toBe("confirmed");
		expect(confirmed.counterpartyKind).toBe("couple");
		expect(confirmed.title).toBe("Test User");
		expect(confirmed.confirmedAt).not.toBeNull();

		const lines = await liveBookingBudgetLines(weddingId);
		expect(lines).toHaveLength(1);
		expect(lines[0]?.label).toBe("Studio confirm");
		expect(lines[0]?.category).toBe("Photography");
		expect(lines[0]?.estimatedCents).toBe(450_000);
	});

	it("returns 404 when a different vendor tries to confirm", async () => {
		await onboardCouple();
		const vendor = await seedVendor("owner");
		const outsider = await seedVendor("outsider");
		const requested = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
			}).expect(200),
		);
		const res = await rpc(
			"/rpc/booking/confirm",
			{ bookingUuid: requested.uuid },
			outsider.vendorClerkId,
		);
		expect(res.status).toBe(404);
	});
});

describe("booking.cancel", () => {
	it("cancels a confirmed booking and reverses its budget line", async () => {
		await onboardCouple();
		const weddingId = await ownedWeddingId();
		const vendor = await seedVendor("cancel");
		const requested = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
				servicePackageUuid: vendor.packageUuid,
			}).expect(200),
		);
		await rpc(
			"/rpc/booking/confirm",
			{ bookingUuid: requested.uuid },
			vendor.vendorClerkId,
		).expect(200);
		expect(await liveBookingBudgetLines(weddingId)).toHaveLength(1);

		const cancelled = rpcBody(
			await rpc("/rpc/booking/cancel", {
				bookingUuid: requested.uuid,
			}).expect(200),
		);
		expect(cancelled.status).toBe("cancelled");
		expect(await liveBookingBudgetLines(weddingId)).toHaveLength(0);
	});

	it("reopens a cancelled booking on a fresh request", async () => {
		await onboardCouple();
		const vendor = await seedVendor("reopen");
		const requested = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
			}).expect(200),
		);
		await rpc("/rpc/booking/cancel", {
			bookingUuid: requested.uuid,
		}).expect(200);

		const reopened = rpcBody(
			await rpc("/rpc/booking/request", {
				vendorServiceUuid: vendor.serviceUuid,
			}).expect(200),
		);
		expect(reopened.uuid).toBe(requested.uuid);
		expect(reopened.status).toBe("pending");
	});
});

describe("booking rosters", () => {
	it("lists bookings for the couple and requests for the vendor", async () => {
		await onboardCouple();
		const vendor = await seedVendor("roster");
		await rpc("/rpc/booking/request", {
			vendorServiceUuid: vendor.serviceUuid,
		}).expect(200);

		const forWedding = rpcBody(
			await rpc("/rpc/booking/listForWedding", {}).expect(200),
		);
		expect(forWedding.items).toHaveLength(1);
		expect(forWedding.items[0].counterpartyKind).toBe("vendor");
		expect(forWedding.items[0].title).toBe("Studio roster");

		const requests = rpcBody(
			await rpc("/rpc/booking/listRequests", {}, vendor.vendorClerkId).expect(
				200,
			),
		);
		expect(requests.items).toHaveLength(1);
		expect(requests.items[0].counterpartyKind).toBe("couple");
		expect(requests.items[0].title).toBe("Test User");
	});

	it("returns 404 for an unknown booking on cancel", async () => {
		await onboardCouple();
		const res = await rpc("/rpc/booking/cancel", {
			bookingUuid: MISSING_UUID,
		});
		expect(res.status).toBe(404);
	});
});
