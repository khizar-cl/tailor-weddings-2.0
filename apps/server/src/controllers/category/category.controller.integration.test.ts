import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "../../../tests/helpers/app.test-helper";
import { truncateTables } from "../../../tests/helpers/db.test-helper";
import { db } from "../../db/db";
import { categories } from "../../db/schema";

const app = createTestApp();

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

afterEach(async () => {
	await truncateTables(categories);
});

describe("category.list", () => {
	beforeEach(async () => {
		await db.insert(categories).values([
			{ slug: "floral", name: "Floral & Decor", sortOrder: 50 },
			{ slug: "venue", name: "Venue", sortOrder: 10 },
			{ slug: "legacy", name: "Legacy", sortOrder: 5, isActive: false },
		]);
	});

	it("returns active categories ordered by sortOrder, exposing only public fields", async () => {
		const res = await request(app).post("/rpc/category/list").expect(200);
		const body = rpcBody(res);

		expect(body.categories.map((c: { slug: string }) => c.slug)).toEqual([
			"venue",
			"floral",
		]);
		for (const category of body.categories) {
			expect(category).toEqual({
				uuid: expect.any(String),
				slug: expect.any(String),
				name: expect.any(String),
			});
		}
	});

	it("excludes inactive categories", async () => {
		const res = await request(app).post("/rpc/category/list").expect(200);
		const slugs = rpcBody(res).categories.map((c: { slug: string }) => c.slug);

		expect(slugs).not.toContain("legacy");
	});
});
