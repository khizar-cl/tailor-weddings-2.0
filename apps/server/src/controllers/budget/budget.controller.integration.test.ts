import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../tests/factories";
import {
	createTestApp,
	withAuth,
} from "../../../tests/helpers/app.test-helper";
import { truncateTables } from "../../../tests/helpers/db.test-helper";
import { categories, users } from "../../db/schema";

const app = createTestApp();

/** Well-formed v4 UUID that never matches a seeded row. */
const MISSING_UUID = "3f0e6b2a-1c4d-4e5f-8a9b-0c1d2e3f4a5b";

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

beforeEach(async () => {
	await createTestUser({ preferences: {} });
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("budget.list", () => {
	it("returns 404 for a user without a wedding", async () => {
		const res = await withAuth(request(app).post("/rpc/budget/list"));
		expect(res.status).toBe(404);
	});

	it("returns generated lines with totals after onboarding", async () => {
		await onboardCouple();
		const body = rpcBody(
			await withAuth(request(app).post("/rpc/budget/list")).expect(200),
		);

		expect(body.totals.estimatedBudgetCents).toBe(3_500_000);
		expect(body.items.length).toBeGreaterThan(0);
		const estimatedSum = body.items.reduce(
			(sum: number, item: { estimatedCents: number | null }) =>
				sum + (item.estimatedCents ?? 0),
			0,
		);
		expect(body.totals.estimatedCents).toBe(estimatedSum);
	});
});

describe("budget item mutations", () => {
	it("adds, updates, and deletes a manual line", async () => {
		await onboardCouple();

		let body = rpcBody(
			await rpc("/rpc/budget/addItem", {
				category: "Venue",
				label: "Reception hall",
				estimatedCents: 2_000_000,
				actualCents: 500_000,
			}).expect(200),
		);
		expect(body.label).toBe("Reception hall");
		expect(body.source).toBe("manual");
		expect(body.estimatedCents).toBe(2_000_000);
		expect(body.vendorBusinessUuid).toBeNull();
		const uuid = body.uuid;

		body = rpcBody(
			await rpc("/rpc/budget/updateItem", {
				uuid,
				category: "Venue",
				label: "Reception hall + tent",
				estimatedCents: 2_200_000,
				actualCents: 2_200_000,
			}).expect(200),
		);
		expect(body.label).toBe("Reception hall + tent");
		expect(body.actualCents).toBe(2_200_000);

		const list = rpcBody(
			await withAuth(request(app).post("/rpc/budget/list")).expect(200),
		);
		const line = list.items.find((i: { uuid: string }) => i.uuid === uuid);
		expect(line.actualCents).toBe(2_200_000);

		const del = rpcBody(
			await rpc("/rpc/budget/deleteItem", { uuid }).expect(200),
		);
		expect(del.deleted).toBe(true);

		const after = rpcBody(
			await withAuth(request(app).post("/rpc/budget/list")).expect(200),
		);
		expect(
			after.items.find((i: { uuid: string }) => i.uuid === uuid),
		).toBeUndefined();
	});

	it("returns 404 updating or deleting an unknown line", async () => {
		await onboardCouple();
		const update = await rpc("/rpc/budget/updateItem", {
			uuid: MISSING_UUID,
			category: "Venue",
			label: "Ghost",
		});
		expect(update.status).toBe(404);
		const remove = await rpc("/rpc/budget/deleteItem", { uuid: MISSING_UUID });
		expect(remove.status).toBe(404);
	});
});
