import { subDays } from "date-fns";
import { and, eq } from "drizzle-orm";
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
	bookings,
	categories,
	reviewRequests,
	reviews,
	servicePackages,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
	weddings,
} from "../../db/schema";
import { generateReviewRequests, publishDueReviews } from "./review.service";

const app = createTestApp();

const MISSING_UUID = "3f0e6b2a-1c4d-4e5f-8a9b-0c1d2e3f4a5b";

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

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

async function testUserId() {
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, "test@example.com"));
	if (!user) throw new Error("Test user not found");
	return user.id;
}

async function ownedWedding() {
	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.ownerUserId, await testUserId()),
		columns: { id: true },
	});
	if (!wedding) throw new Error("Wedding not found");
	return wedding.id;
}

/** A vendor with a published photography service + package. */
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
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, "photography"),
		columns: { id: true },
	});
	if (!category) throw new Error("Category not seeded");
	const [service] = await db
		.insert(vendorServices)
		.values({
			vendorBusinessId: business.id,
			categoryId: category.id,
			isPublished: true,
			isPrimary: true,
		})
		.returning({ id: vendorServices.id });
	if (!service) throw new Error("Failed to seed vendor service");
	const [pkg] = await db
		.insert(servicePackages)
		.values({
			vendorServiceId: service.id,
			name: `${key} package`,
			priceCents: 450_000,
		})
		.returning({ id: servicePackages.id });
	if (!pkg) throw new Error("Failed to seed package");
	return {
		vendorClerkId: `vendor_${key}`,
		vendorUserId: vendorUser.id,
		businessId: business.id,
		businessUuid: business.uuid,
		serviceId: service.id,
		packageId: pkg.id,
	};
}

type SeededVendor = Awaited<ReturnType<typeof seedVendor>>;

async function confirmBooking(weddingId: number, vendor: SeededVendor) {
	await db.insert(bookings).values({
		weddingId,
		servicePackageId: vendor.packageId,
		vendorBusinessId: vendor.businessId,
		status: "confirmed",
	});
}

async function setWeddingDate(weddingId: number, date: Date) {
	await db
		.update(weddings)
		.set({ weddingDate: date })
		.where(eq(weddings.id, weddingId));
}

async function requestUuid(
	weddingId: number,
	subjectBusinessId: number,
	type: "client" | "peer",
	targetUserId: number,
) {
	const row = await db.query.reviewRequests.findFirst({
		where: and(
			eq(reviewRequests.weddingId, weddingId),
			eq(reviewRequests.subjectVendorBusinessId, subjectBusinessId),
			eq(reviewRequests.type, type),
			eq(reviewRequests.targetUserId, targetUserId),
		),
		columns: { uuid: true },
	});
	if (!row) throw new Error("Expected review request not found");
	return row.uuid;
}

async function seedAdmin() {
	await createTestUser({
		clerkId: "admin_user",
		email: "admin@example.com",
		name: "Admin",
		role: "admin",
	});
	return "admin_user";
}

/** Onboard-agnostic: submit a couple's client review for a fresh vendor. */
async function submitClientReview(key: string) {
	const weddingId = await ownedWedding();
	await setWeddingDate(weddingId, subDays(new Date(), 2));
	const vendor = await seedVendor(key);
	await confirmBooking(weddingId, vendor);
	await generateReviewRequests(new Date());
	const reqUuid = await requestUuid(
		weddingId,
		vendor.businessId,
		"client",
		await testUserId(),
	);
	const review = rpcBody(
		await rpc("/rpc/review/submitReview", {
			reviewRequestUuid: reqUuid,
			overallRating: 5,
		}).expect(200),
	);
	return { vendor, weddingId, reviewUuid: review.uuid as string };
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

describe("review request generation (T+1)", () => {
	it("creates client + peer requests for co-booked vendors, idempotently", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const a = await seedVendor("a");
		const b = await seedVendor("b");
		await confirmBooking(weddingId, a);
		await confirmBooking(weddingId, b);

		const first = await generateReviewRequests(new Date());
		// 2 client (couple→A, couple→B) + 2 peer (A→B, B→A).
		expect(first.created).toBe(4);

		const again = await generateReviewRequests(new Date());
		expect(again.created).toBe(0);

		const all = await db.query.reviewRequests.findMany({
			where: eq(reviewRequests.weddingId, weddingId),
			columns: { type: true },
		});
		expect(all.filter((r) => r.type === "client")).toHaveLength(2);
		expect(all.filter((r) => r.type === "peer")).toHaveLength(2);
	});

	it("skips weddings that are not yet a day past", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, new Date()); // today
		const a = await seedVendor("today");
		await confirmBooking(weddingId, a);

		const { created } = await generateReviewRequests(new Date());
		expect(created).toBe(0);
	});
});

describe("review publishing (T+7)", () => {
	it("publishes pending reviews only once the wedding is a week past", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		const a = await seedVendor("pub");
		await confirmBooking(weddingId, a);

		// Recent wedding → a submitted review stays embargoed.
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		await generateReviewRequests(new Date());
		const reqUuid = await requestUuid(
			weddingId,
			a.businessId,
			"client",
			await testUserId(),
		);
		const review = rpcBody(
			await rpc("/rpc/review/submitReview", {
				reviewRequestUuid: reqUuid,
				overallRating: 5,
				body: "Wonderful to work with.",
			}).expect(200),
		);
		expect(review.publishedAt).toBeNull();

		const early = await publishDueReviews(new Date());
		expect(early.published).toBe(0);

		// Push the wedding past the embargo window → it publishes.
		await setWeddingDate(weddingId, subDays(new Date(), 8));
		const late = await publishDueReviews(new Date());
		expect(late.published).toBe(1);

		const list = rpcBody(
			await rpc("/rpc/review/listForBusiness", {
				vendorBusinessUuid: a.businessUuid,
			}).expect(200),
		);
		expect(list.items).toHaveLength(1);
		// Reviews show first names only, never surnames.
		expect(list.items[0].authorName).toBe("Test");
		expect(list.items[0].type).toBe("client");
	});
});

describe("review.submitReview", () => {
	it("lets a couple submit against their request; it stays embargoed", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const a = await seedVendor("client");
		await confirmBooking(weddingId, a);
		await generateReviewRequests(new Date());
		const reqUuid = await requestUuid(
			weddingId,
			a.businessId,
			"client",
			await testUserId(),
		);

		const review = rpcBody(
			await rpc("/rpc/review/submitReview", {
				reviewRequestUuid: reqUuid,
				overallRating: 4,
			}).expect(200),
		);
		expect(review.type).toBe("client");

		// Not published yet → absent from the public listing.
		const list = rpcBody(
			await rpc("/rpc/review/listForBusiness", {
				vendorBusinessUuid: a.businessUuid,
			}).expect(200),
		);
		expect(list.items).toHaveLength(0);

		// The request is spent — a second submission conflicts.
		const dupe = await rpc("/rpc/review/submitReview", {
			reviewRequestUuid: reqUuid,
			overallRating: 3,
		});
		expect(dupe.status).toBe(409);
	});

	it("lets a co-booked vendor submit a peer review", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const a = await seedVendor("peer-a");
		const b = await seedVendor("peer-b");
		await confirmBooking(weddingId, a);
		await confirmBooking(weddingId, b);
		await generateReviewRequests(new Date());

		// Vendor A reviews vendor B.
		const reqUuid = await requestUuid(
			weddingId,
			b.businessId,
			"peer",
			a.vendorUserId,
		);
		const review = rpcBody(
			await rpc(
				"/rpc/review/submitReview",
				{ reviewRequestUuid: reqUuid, overallRating: 5 },
				a.vendorClerkId,
			).expect(200),
		);
		expect(review.type).toBe("peer");
		expect(review.authorName).toBe("Studio peer-a");
	});

	it("404s when submitting a request that isn't the caller's", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const a = await seedVendor("not-mine");
		await confirmBooking(weddingId, a);
		await generateReviewRequests(new Date());
		const reqUuid = await requestUuid(
			weddingId,
			a.businessId,
			"client",
			await testUserId(),
		);

		// The vendor is not the target of the couple's client request.
		const res = await rpc(
			"/rpc/review/submitReview",
			{ reviewRequestUuid: reqUuid, overallRating: 5 },
			a.vendorClerkId,
		);
		expect(res.status).toBe(404);
	});

	it("lists the caller's pending requests", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const a = await seedVendor("mine");
		await confirmBooking(weddingId, a);
		await generateReviewRequests(new Date());

		const mine = rpcBody(
			await rpc("/rpc/review/listMyRequests", {}).expect(200),
		);
		expect(mine.items).toHaveLength(1);
		expect(mine.items[0].subjectBusinessName).toBe("Studio mine");
		expect(mine.items[0].type).toBe("client");
	});
});

describe("review.moderate", () => {
	it("forbids non-admins", async () => {
		await onboardCouple();
		const res = await rpc("/rpc/review/moderate", {
			reviewUuid: MISSING_UUID,
			status: "rejected",
		});
		expect(res.status).toBe(403);
	});

	it("lets an admin publish a pending review", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const a = await seedVendor("mod");
		await confirmBooking(weddingId, a);
		await generateReviewRequests(new Date());
		const reqUuid = await requestUuid(
			weddingId,
			a.businessId,
			"client",
			await testUserId(),
		);
		const review = rpcBody(
			await rpc("/rpc/review/submitReview", {
				reviewRequestUuid: reqUuid,
				overallRating: 5,
			}).expect(200),
		);

		await createTestUser({
			clerkId: "admin_user",
			email: "admin@example.com",
			name: "Admin",
			role: "admin",
		});
		const moderated = rpcBody(
			await rpc(
				"/rpc/review/moderate",
				{ reviewUuid: review.uuid, status: "published" },
				"admin_user",
			).expect(200),
		);
		expect(moderated.publishedAt).not.toBeNull();

		const list = rpcBody(
			await rpc("/rpc/review/listForBusiness", {
				vendorBusinessUuid: a.businessUuid,
			}).expect(200),
		);
		expect(list.items).toHaveLength(1);
	});

	it("404s when moderating an unknown review", async () => {
		await onboardCouple();
		const admin = await seedAdmin();
		const res = await rpc(
			"/rpc/review/moderate",
			{ reviewUuid: MISSING_UUID, status: "rejected" },
			admin,
		);
		expect(res.status).toBe(404);
	});

	it("rejecting a published review drops it from the listing", async () => {
		await onboardCouple();
		const { vendor, reviewUuid } = await submitClientReview("reject");
		const admin = await seedAdmin();
		await rpc(
			"/rpc/review/moderate",
			{ reviewUuid, status: "published" },
			admin,
		).expect(200);

		const rejected = rpcBody(
			await rpc(
				"/rpc/review/moderate",
				{ reviewUuid, status: "rejected" },
				admin,
			).expect(200),
		);
		expect(rejected.publishedAt).toBeNull();

		const list = rpcBody(
			await rpc("/rpc/review/listForBusiness", {
				vendorBusinessUuid: vendor.businessUuid,
			}).expect(200),
		);
		expect(list.items).toHaveLength(0);
	});
});

describe("review.listForBusiness", () => {
	it("404s for an unknown business", async () => {
		await onboardCouple();
		const res = await rpc("/rpc/review/listForBusiness", {
			vendorBusinessUuid: MISSING_UUID,
		});
		expect(res.status).toBe(404);
	});

	it("filters published reviews by type", async () => {
		await onboardCouple();
		const { vendor, weddingId } = await submitClientReview("filter");
		await setWeddingDate(weddingId, subDays(new Date(), 8));
		await publishDueReviews(new Date());

		const clientOnly = rpcBody(
			await rpc("/rpc/review/listForBusiness", {
				vendorBusinessUuid: vendor.businessUuid,
				type: "client",
			}).expect(200),
		);
		expect(clientOnly.items).toHaveLength(1);

		const peerOnly = rpcBody(
			await rpc("/rpc/review/listForBusiness", {
				vendorBusinessUuid: vendor.businessUuid,
				type: "peer",
			}).expect(200),
		);
		expect(peerOnly.items).toHaveLength(0);
	});
});

describe("review.submitReview conflicts", () => {
	it("409s when a review already exists for the wedding", async () => {
		await onboardCouple();
		const weddingId = await ownedWedding();
		await setWeddingDate(weddingId, subDays(new Date(), 2));
		const vendor = await seedVendor("dupe-review");
		await confirmBooking(weddingId, vendor);
		await generateReviewRequests(new Date());
		const ownerId = await testUserId();
		const reqUuid = await requestUuid(
			weddingId,
			vendor.businessId,
			"client",
			ownerId,
		);

		// A review already exists for (author, subject, wedding) while the request
		// is still open — the insert hits the uniqueness guard.
		await db.insert(reviews).values({
			type: "client",
			authorUserId: ownerId,
			subjectVendorBusinessId: vendor.businessId,
			weddingId,
			overallRating: 4,
			status: "pending",
		});

		const res = await rpc("/rpc/review/submitReview", {
			reviewRequestUuid: reqUuid,
			overallRating: 5,
		});
		expect(res.status).toBe(409);
	});
});
