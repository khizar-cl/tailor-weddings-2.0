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
import { categories, checklistItems, users } from "../../db/schema";

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
		guestCountEstimate: 100,
		city: "Austin",
		region: "Texas",
		styleTags: ["Modern"],
		stylePalette: [],
	}).expect(200);
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("checklist.list", () => {
	it("returns the generated tasks after onboarding", async () => {
		await onboardCouple();
		const res = await withAuth(request(app).post("/rpc/checklist/list")).expect(
			200,
		);
		const items: Array<{ source: string; isComplete: boolean }> =
			rpcBody(res).items;
		expect(items.length).toBeGreaterThan(0);
		expect(items.every((i) => i.source === "generated")).toBe(true);
		expect(items.every((i) => i.isComplete === false)).toBe(true);
	});

	it("returns 404 for a user without a wedding", async () => {
		const res = await withAuth(request(app).post("/rpc/checklist/list"));
		expect(res.status).toBe(404);
	});
});

describe("checklist.addTask", () => {
	it("adds a manual task with a category that appears in the list", async () => {
		await onboardCouple();
		const [category] = await db
			.insert(categories)
			.values({ slug: "floral", name: "Floral & Décor" })
			.returning({ uuid: categories.uuid });
		if (!category) throw new Error("Failed to seed category");

		const addRes = await rpc("/rpc/checklist/addTask", {
			title: "Book a florist",
			categoryUuid: category.uuid,
		}).expect(200);
		const added = rpcBody(addRes);
		expect(added.source).toBe("manual");
		expect(added.title).toBe("Book a florist");
		expect(added.category?.name).toBe("Floral & Décor");

		const listRes = await withAuth(
			request(app).post("/rpc/checklist/list"),
		).expect(200);
		const uuids = rpcBody(listRes).items.map((i: { uuid: string }) => i.uuid);
		expect(uuids).toContain(added.uuid);
	});

	it("adds an uncategorized task when no category is given", async () => {
		await onboardCouple();
		const added = rpcBody(
			await rpc("/rpc/checklist/addTask", { title: "Write our vows" }).expect(
				200,
			),
		);
		expect(added.category).toBeNull();
	});

	it("rejects an unknown category", async () => {
		await onboardCouple();
		const res = await rpc("/rpc/checklist/addTask", {
			title: "Book a florist",
			categoryUuid: "00000000-0000-0000-0000-000000000000",
		});
		expect(res.status).toBe(404);
	});

	it("rejects an empty title", async () => {
		await onboardCouple();
		const res = await rpc("/rpc/checklist/addTask", { title: "" });
		expect(res.status).toBe(400);
	});

	it("rejects adding beyond the 100-item cap", async () => {
		await onboardCouple();
		const wedding = await db.query.weddings.findFirst({
			columns: { id: true },
		});
		if (!wedding) throw new Error("Expected a wedding after onboarding");

		const existing = await db.query.checklistItems.findMany({
			where: eq(checklistItems.weddingId, wedding.id),
			columns: { id: true },
		});
		const filler = 100 - existing.length;
		await db.insert(checklistItems).values(
			Array.from({ length: filler }, (_, i) => ({
				weddingId: wedding.id,
				title: `Filler ${i}`,
			})),
		);

		const res = await rpc("/rpc/checklist/addTask", { title: "One too many" });
		expect(res.status).toBe(403);
	});
});

describe("checklist.toggleComplete", () => {
	it("marks a task complete", async () => {
		await onboardCouple();
		const added = rpcBody(
			await rpc("/rpc/checklist/addTask", { title: "Book a florist" }).expect(
				200,
			),
		);

		const toggled = rpcBody(
			await rpc("/rpc/checklist/toggleComplete", {
				uuid: added.uuid,
				isComplete: true,
			}).expect(200),
		);
		expect(toggled.isComplete).toBe(true);
	});
});

describe("checklist.removeTask", () => {
	it("soft-deletes a task so it drops out of the list", async () => {
		await onboardCouple();
		const added = rpcBody(
			await rpc("/rpc/checklist/addTask", { title: "Book a florist" }).expect(
				200,
			),
		);

		const removed = rpcBody(
			await rpc("/rpc/checklist/removeTask", { uuid: added.uuid }).expect(200),
		);
		expect(removed.deleted).toBe(true);

		const listRes = await withAuth(
			request(app).post("/rpc/checklist/list"),
		).expect(200);
		const uuids = rpcBody(listRes).items.map((i: { uuid: string }) => i.uuid);
		expect(uuids).not.toContain(added.uuid);
	});
});
