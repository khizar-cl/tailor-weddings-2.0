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
	categories,
	savedVendors,
	users,
	vendorAccounts,
	vendorBusinesses,
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

function get(path: string, clerkId?: string) {
	const base = request(app).post(path);
	return clerkId ? withAuth(base, clerkId) : withAuth(base);
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
	return {
		vendorClerkId: `vendor_${key}`,
		vendorUserId: vendorUser.id,
		businessId: business.id,
		businessUuid: business.uuid,
	};
}

/** Save a vendor to the couple's wedding, then open a thread; returns its uuid. */
async function savedThread(key: string) {
	const weddingId = await ownedWeddingId();
	const vendor = await seedVendor(key);
	await db
		.insert(savedVendors)
		.values({ weddingId, vendorBusinessId: vendor.businessId });
	const started = rpcBody(
		await rpc("/rpc/messaging/startThread", {
			vendorBusinessUuid: vendor.businessUuid,
		}).expect(200),
	);
	return { vendor, conversationUuid: started.uuid as string, started };
}

beforeEach(async () => {
	await createTestUser({ preferences: {} });
});

afterEach(async () => {
	await truncateTables(users, categories);
});

describe("messaging.startThread", () => {
	it("forbids messaging a vendor that is neither saved nor booked", async () => {
		await onboardCouple();
		const vendor = await seedVendor("cold");
		const res = await rpc("/rpc/messaging/startThread", {
			vendorBusinessUuid: vendor.businessUuid,
		});
		expect(res.status).toBe(403);
	});

	it("opens a thread for a saved vendor (couple sees the business)", async () => {
		await onboardCouple();
		const { started } = await savedThread("saved");
		expect(started.counterpartyKind).toBe("vendor");
		expect(started.title).toBe("Studio saved");
		expect(started.unreadCount).toBe(0);
		expect(started.lastMessageAt).toBeNull();
	});
});

describe("messaging threads", () => {
	it("sends a message and reflects it in the thread and list", async () => {
		await onboardCouple();
		const { conversationUuid } = await savedThread("chat");

		const sent = rpcBody(
			await rpc("/rpc/messaging/sendMessage", {
				conversationUuid,
				body: "Hi there!",
			}).expect(200),
		);
		expect(sent.isMine).toBe(true);
		expect(sent.senderName).toBe("Test User");

		const detail = rpcBody(
			await rpc("/rpc/messaging/getThread", { conversationUuid }).expect(200),
		);
		expect(detail.messages).toHaveLength(1);
		expect(detail.messages[0].body).toBe("Hi there!");

		const list = rpcBody(await get("/rpc/messaging/listThreads").expect(200));
		expect(list.items).toHaveLength(1);
		expect(list.items[0].lastMessagePreview).toBe("Hi there!");
		// Your own message is never unread.
		expect(list.items[0].unreadCount).toBe(0);
	});

	it("counts the other party's messages as unread; markRead clears them", async () => {
		await onboardCouple();
		const { vendor, conversationUuid } = await savedThread("unread");

		// The vendor is a participant and sees the couple's name.
		const vendorList = rpcBody(
			await get("/rpc/messaging/listThreads", vendor.vendorClerkId).expect(200),
		);
		expect(vendorList.items).toHaveLength(1);
		expect(vendorList.items[0].counterpartyKind).toBe("couple");
		expect(vendorList.items[0].title).toBe("Test User");

		await rpc(
			"/rpc/messaging/sendMessage",
			{ conversationUuid, body: "Thanks for reaching out!" },
			vendor.vendorClerkId,
		).expect(200);

		const list = rpcBody(await get("/rpc/messaging/listThreads").expect(200));
		expect(list.items[0].unreadCount).toBe(1);
		expect(list.items[0].lastMessagePreview).toBe("Thanks for reaching out!");

		const detail = rpcBody(
			await rpc("/rpc/messaging/getThread", { conversationUuid }).expect(200),
		);
		expect(detail.thread.unreadCount).toBe(1);
		expect(detail.messages[0].isMine).toBe(false);
		expect(detail.messages[0].senderName).toBe("Vendor unread");

		const marked = rpcBody(
			await rpc("/rpc/messaging/markRead", { conversationUuid }).expect(200),
		);
		expect(marked.unreadCount).toBe(0);
		const after = rpcBody(await get("/rpc/messaging/listThreads").expect(200));
		expect(after.items[0].unreadCount).toBe(0);
	});

	it("returns 404 for unknown and non-member conversations", async () => {
		await onboardCouple();
		const { conversationUuid } = await savedThread("member");

		const unknown = await rpc("/rpc/messaging/getThread", {
			conversationUuid: MISSING_UUID,
		});
		expect(unknown.status).toBe(404);

		// A different vendor is not a participant of this thread.
		const outsider = await seedVendor("outsider");
		const forbidden = await rpc(
			"/rpc/messaging/getThread",
			{ conversationUuid },
			outsider.vendorClerkId,
		);
		expect(forbidden.status).toBe(404);
	});
});
