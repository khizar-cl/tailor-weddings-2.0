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
	bookings,
	budgetItems,
	categories,
	checklistItems,
	savedVendors,
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

/** Seed a vendor business (no services) and return its id. */
async function seedBusiness(key: string) {
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
		.returning({ id: vendorBusinesses.id });
	if (!business) throw new Error("Failed to seed vendor business");
	return business.id;
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("wedding.getSummary", () => {
	it("returns 404 for a user without a wedding", async () => {
		const res = await withAuth(request(app).post("/rpc/wedding/getSummary"));
		expect(res.status).toBe(404);
	});

	it("summarizes checklist progress, budget, team, and the wedding header", async () => {
		await seedCategory("photography", "Photography");
		await seedPublishedVendor();
		await onboardCouple();
		const weddingId = await ownedWeddingId();

		// Complete one generated checklist item.
		const first = await db.query.checklistItems.findFirst({
			where: eq(checklistItems.weddingId, weddingId),
			columns: { uuid: true },
		});
		if (!first) throw new Error("Expected a generated checklist item");
		await rpc("/rpc/checklist/toggleComplete", {
			uuid: first.uuid,
			isComplete: true,
		}).expect(200);

		// Record a payment on one budget line.
		const budgetLine = await db.query.budgetItems.findFirst({
			where: eq(budgetItems.weddingId, weddingId),
			columns: { id: true },
		});
		if (!budgetLine) throw new Error("Expected a generated budget line");
		await db
			.update(budgetItems)
			.set({ actualCents: 250_000 })
			.where(eq(budgetItems.id, budgetLine.id));

		const res = await withAuth(
			request(app).post("/rpc/wedding/getSummary"),
		).expect(200);
		const body = rpcBody(res);

		expect(body.wedding.city).toBe("Austin");
		expect(body.wedding.region).toBe("Texas");
		expect(body.wedding.guestCountEstimate).toBe(120);
		expect(body.checklist.total).toBeGreaterThan(0);
		expect(body.checklist.done).toBe(1);
		expect(body.budget.estimatedCents).toBe(3_500_000);
		expect(body.budget.paidCents).toBe(250_000);
		expect(body.teamCount).toBe(0);
		// Onboarding seeds a recommendation for the published Texas photographer.
		expect(body.recommendations.length).toBeGreaterThan(0);
		expect(body.recommendations[0].businessName).toBe("Studio photography");
		expect(body.recommendations[0].categoryName).toBe("Photography");
	});

	it("counts distinct saved and booked businesses once each", async () => {
		await seedCategory("photography", "Photography");
		await seedCategory("floral", "Floral");
		await onboardCouple();
		const weddingId = await ownedWeddingId();
		const savedId = await seedBusiness("saved");
		const bookedId = await seedBusiness("booked");
		const bookedServiceId = await attachService(bookedId, "photography");

		await db.insert(savedVendors).values([
			{ weddingId, vendorBusinessId: savedId },
			{ weddingId, vendorBusinessId: bookedId },
		]);
		await db.insert(bookings).values({
			weddingId,
			vendorBusinessId: bookedId,
			vendorServiceId: bookedServiceId,
			status: "confirmed",
		});
		// A cancelled booking must not count toward the team.
		const cancelledId = await seedBusiness("cancelled");
		const cancelledServiceId = await attachService(cancelledId, "floral");
		await db.insert(bookings).values({
			weddingId,
			vendorBusinessId: cancelledId,
			vendorServiceId: cancelledServiceId,
			status: "cancelled",
		});

		const res = await withAuth(
			request(app).post("/rpc/wedding/getSummary"),
		).expect(200);
		// savedId + bookedId (bookedId saved AND booked counts once); cancelled excluded.
		expect(rpcBody(res).teamCount).toBe(2);
	});
});

describe("wedding.getTeam", () => {
	it("returns 404 for a user without a wedding", async () => {
		const res = await withAuth(request(app).post("/rpc/wedding/getTeam"));
		expect(res.status).toBe(404);
	});

	it("rosters saved and booked vendors and lists uncovered categories", async () => {
		await seedCategory("photography", "Photography");
		await seedCategory("floral", "Floral");
		await seedCategory("catering", "Catering");
		await onboardCouple();
		const weddingId = await ownedWeddingId();

		const savedId = await seedBusiness("saved");
		await attachService(savedId, "photography");
		const bookedId = await seedBusiness("booked");
		const bookedServiceId = await attachService(bookedId, "floral");

		await db
			.insert(savedVendors)
			.values({ weddingId, vendorBusinessId: savedId });
		await db.insert(bookings).values({
			weddingId,
			vendorBusinessId: bookedId,
			vendorServiceId: bookedServiceId,
			status: "confirmed",
		});

		const body = rpcBody(
			await withAuth(request(app).post("/rpc/wedding/getTeam")).expect(200),
		);

		expect(body.members).toHaveLength(2);
		const photo = body.members.find(
			(m: { primaryCategoryName: string | null }) =>
				m.primaryCategoryName === "Photography",
		);
		expect(photo.isSaved).toBe(true);
		expect(photo.isBooked).toBe(false);
		expect(photo.bookingStatus).toBeNull();
		const floral = body.members.find(
			(m: { primaryCategoryName: string | null }) =>
				m.primaryCategoryName === "Floral",
		);
		expect(floral.isBooked).toBe(true);
		expect(floral.bookingStatus).toBe("confirmed");
		expect(floral.isSaved).toBe(false);

		// photography + floral are covered; catering is the only gap.
		expect(body.missingCategories.map((c: { slug: string }) => c.slug)).toEqual(
			["catering"],
		);
	});

	it("counts a vendor that is both saved and booked once", async () => {
		await seedCategory("photography", "Photography");
		await onboardCouple();
		const weddingId = await ownedWeddingId();
		const dualId = await seedBusiness("dual");
		const dualServiceId = await attachService(dualId, "photography");
		await db
			.insert(savedVendors)
			.values({ weddingId, vendorBusinessId: dualId });
		await db.insert(bookings).values({
			weddingId,
			vendorBusinessId: dualId,
			vendorServiceId: dualServiceId,
			status: "pending",
		});

		const body = rpcBody(
			await withAuth(request(app).post("/rpc/wedding/getTeam")).expect(200),
		);
		expect(body.members).toHaveLength(1);
		expect(body.members[0].isSaved).toBe(true);
		expect(body.members[0].isBooked).toBe(true);
		expect(body.members[0].bookingStatus).toBe("pending");
		expect(body.missingCategories).toHaveLength(0);
	});
});

/** Seed an active category, returning nothing (id looked up by slug elsewhere). */
async function seedCategory(slug: string, name: string) {
	await db.insert(categories).values({ slug, name });
}

/** Attach a published primary service in `slug`'s category; returns its id. */
async function attachService(businessId: number, slug: string) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, slug),
		columns: { id: true },
	});
	if (!category) throw new Error(`Seed the ${slug} category first`);
	const [service] = await db
		.insert(vendorServices)
		.values({
			vendorBusinessId: businessId,
			categoryId: category.id,
			isPrimary: true,
			isPublished: true,
		})
		.returning({ id: vendorServices.id });
	if (!service) throw new Error("Failed to attach service");
	return service.id;
}

/** Seed a published, verified Texas vendor with one photography service. */
async function seedPublishedVendor() {
	const category = await db.query.categories.findFirst({
		where: eq(categories.slug, "photography"),
		columns: { id: true },
	});
	if (!category) throw new Error("Seed the photography category first");
	const businessId = await seedBusiness("photography");
	await db.insert(vendorServices).values({
		vendorBusinessId: businessId,
		categoryId: category.id,
		isPublished: true,
		isPrimary: true,
		startingPriceCents: 300_000,
	});
}
