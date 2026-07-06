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
import { users, vendorAccounts, weddings } from "../../db/schema";

const app = createTestApp();

function rpcBody(res: request.Response) {
	return res.body?.json ?? res.body;
}

let testUserId: number;

beforeEach(async () => {
	const user = await createTestUser({ role: "member" });
	testUserId = user.id;
});

afterEach(async () => {
	await truncateTables(users);
});

describe("auth.completeProfile", () => {
	it("updates the name but never honors a client-supplied admin role", async () => {
		await withAuth(request(app).post("/rpc/auth/completeProfile"))
			.set("Content-Type", "application/json")
			.send(JSON.stringify({ json: { name: "Mallory", role: "admin" } }))
			.expect(200);

		const user = await db.query.users.findFirst({
			where: eq(users.email, "test@example.com"),
			columns: { name: true, role: true },
		});

		expect(user?.name).toBe("Mallory");
		expect(user?.role).toBe("member");
	});
});

describe("auth.addCapability", () => {
	it("provisions the vendor workspace and switches into it", async () => {
		await db.insert(weddings).values({ ownerUserId: testUserId });

		const res = await withAuth(
			request(app)
				.post("/rpc/auth/addCapability")
				.set("Content-Type", "application/json")
				.send(JSON.stringify({ json: { capability: "vendor" } })),
		).expect(200);

		const body = rpcBody(res);
		expect(body.capabilities).toEqual({ isCouple: true, isVendor: true });
		expect(body.activeMode).toBe("vendor");

		const account = await db.query.vendorAccounts.findFirst({
			where: eq(vendorAccounts.userId, testUserId),
		});
		expect(account).toBeTruthy();
	});
});
