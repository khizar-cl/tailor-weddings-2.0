import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../tests/factories";
import {
	createTestApp,
	withAuth,
} from "../../../tests/helpers/app.test-helper";
import { truncateTables } from "../../../tests/helpers/db.test-helper";
import { db } from "../../db/db";
import { users, vendorAccounts, weddings } from "../../db/schema";

const app = createTestApp();

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

afterEach(async () => {
	await truncateTables(users);
});

describe("user.me", () => {
	describe("with existing user", () => {
		beforeEach(async () => {
			await createTestUser();
		});

		it("returns authenticated user with uuid and role", async () => {
			const res = await withAuth(request(app).post("/rpc/user/me")).expect(200);
			const body = rpcBody(res);

			expect(body).toMatchObject({
				email: "test@example.com",
				name: "Test User",
				role: "member",
			});
			expect(body).toHaveProperty("uuid");
			expect(body).not.toHaveProperty("id");
			expect(body).not.toHaveProperty("clerkId");
		});

		it("returns 401 without auth", async () => {
			const res = await request(app).post("/rpc/user/me");
			expect(res.status).toBe(401);
		});
	});

	it("auto-inserts user from Clerk on first authenticated request", async () => {
		const res = await withAuth(request(app).post("/rpc/user/me")).expect(200);
		const body = rpcBody(res);

		expect(body).toMatchObject({
			email: "test@example.com",
			role: "member",
		});
		expect(body).toHaveProperty("uuid");
	});
});

describe("user.getPreferences", () => {
	beforeEach(async () => {
		await createTestUser({ preferences: { theme: "dark" } });
	});

	it("returns user preferences", async () => {
		const res = await withAuth(
			request(app).post("/rpc/user/getPreferences"),
		).expect(200);

		expect(rpcBody(res)).toEqual({ theme: "dark" });
	});

	it("returns 401 without auth", async () => {
		const res = await request(app).post("/rpc/user/getPreferences");
		expect(res.status).toBe(401);
	});
});

describe("user.setPreferences", () => {
	beforeEach(async () => {
		await createTestUser({ preferences: { theme: "light" } });
	});

	it("updates and returns preferences", async () => {
		const res = await withAuth(
			request(app)
				.post("/rpc/user/setPreferences")
				.set("Content-Type", "application/json")
				.send(JSON.stringify({ json: { theme: "dark" } })),
		).expect(200);

		expect(rpcBody(res)).toEqual(expect.objectContaining({ theme: "dark" }));
	});

	it("returns 401 without auth", async () => {
		const res = await request(app).post("/rpc/user/setPreferences");
		expect(res.status).toBe(401);
	});
});

describe("user.me identity payload", () => {
	it("returns derived capabilities, active mode and onboarding", async () => {
		const user = await createTestUser();
		await db.insert(weddings).values({ ownerUserId: user.id });

		const res = await withAuth(request(app).post("/rpc/user/me")).expect(200);
		const body = rpcBody(res);

		expect(body.capabilities).toEqual({ isCouple: true, isVendor: false });
		expect(body.activeMode).toBe("couple");
		expect(body.onboarding).toEqual({ couple: false, vendor: false });
	});
});

describe("user.setActiveMode", () => {
	it("switches to a workspace the user owns", async () => {
		const user = await createTestUser();
		await db.insert(weddings).values({ ownerUserId: user.id });
		await db.insert(vendorAccounts).values({ userId: user.id });

		const res = await withAuth(
			request(app)
				.post("/rpc/user/setActiveMode")
				.set("Content-Type", "application/json")
				.send(JSON.stringify({ json: { mode: "vendor" } })),
		).expect(200);

		expect(rpcBody(res).activeMode).toBe("vendor");
	});

	it("rejects switching to a workspace the user does not own", async () => {
		const user = await createTestUser();
		await db.insert(weddings).values({ ownerUserId: user.id });

		const res = await withAuth(
			request(app)
				.post("/rpc/user/setActiveMode")
				.set("Content-Type", "application/json")
				.send(JSON.stringify({ json: { mode: "vendor" } })),
		);

		expect(res.status).toBe(403);
	});
});

describe("user.list", () => {
	it("returns all users for an admin", async () => {
		await createTestUser({ role: "admin" });

		const res = await withAuth(request(app).post("/rpc/user/list")).expect(200);

		expect(Array.isArray(rpcBody(res).users)).toBe(true);
	});

	it("forbids non-admins", async () => {
		await createTestUser({ role: "member" });

		const res = await withAuth(request(app).post("/rpc/user/list"));

		expect(res.status).toBe(403);
	});
});
