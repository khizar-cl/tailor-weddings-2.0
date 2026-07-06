import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../tests/factories";
import {
	createTestApp,
	withAuth,
} from "../../../tests/helpers/app.test-helper";
import { truncateTables } from "../../../tests/helpers/db.test-helper";
import { users } from "../../db/schema";

const app = createTestApp();

afterEach(async () => {
	await truncateTables(users);
});

describe("email.invite", () => {
	it("forbids non-admins from sending invites", async () => {
		await createTestUser({ role: "member" });

		const res = await withAuth(
			request(app)
				.post("/rpc/email/invite")
				.set("Content-Type", "application/json")
				.send(JSON.stringify({ json: { to: "guest@example.com" } })),
		);

		expect(res.status).toBe(403);
	});
});
