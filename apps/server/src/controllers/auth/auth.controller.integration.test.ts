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
import { users } from "../../db/schema";

const app = createTestApp();

beforeEach(async () => {
	await createTestUser({ role: "member" });
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
