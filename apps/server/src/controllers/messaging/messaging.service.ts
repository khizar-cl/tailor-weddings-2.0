import { ORPCError } from "@orpc/server";
import type {
	MessageSchema,
	SendMessageInputSchema,
	ThreadDetailSchema,
	ThreadListSchema,
	ThreadSummarySchema,
} from "@repo/shared";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import {
	bookings,
	conversationParticipants,
	conversations,
	db,
	messages,
	savedVendors,
	users,
	vendorBusinesses,
} from "../../db";
import { presignImage } from "../vendor/vendor.helpers";
import { coupleWeddingWhere } from "../wedding/wedding-access";

/** Conversation loaded with the two parties' display fields. */
type ConversationWithParties = {
	id: number;
	uuid: string;
	lastMessageAt: Date | null;
	vendorBusiness: {
		businessName: string;
		city: string | null;
		region: string | null;
		logo: { key: string; fileName: string } | null;
		account: { userId: number };
	};
	wedding: {
		city: string | null;
		region: string | null;
		owner: { name: string | null } | null;
		partner: { name: string | null } | null;
	};
};

const conversationWith = {
	columns: { id: true, uuid: true, lastMessageAt: true },
	with: {
		vendorBusiness: {
			columns: {
				businessName: true,
				city: true,
				region: true,
			},
			with: {
				logo: { columns: { key: true, fileName: true } },
				account: { columns: { userId: true } },
			},
		},
		wedding: {
			columns: { city: true, region: true },
			with: {
				owner: { columns: { name: true } },
				partner: { columns: { name: true } },
			},
		},
	},
} as const;

function location(city: string | null, region: string | null) {
	const parts = [city, region].filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : null;
}

async function buildSummary(
	conv: ConversationWithParties,
	dbUserId: number,
	unreadCount: number,
	lastMessagePreview: string | null,
): Promise<ThreadSummarySchema> {
	const isVendorSide = conv.vendorBusiness.account.userId === dbUserId;
	const coupleName =
		[conv.wedding.owner?.name, conv.wedding.partner?.name]
			.filter(Boolean)
			.join(" & ") || "Couple";

	return {
		uuid: conv.uuid,
		counterpartyKind: isVendorSide ? "couple" : "vendor",
		title: isVendorSide ? coupleName : conv.vendorBusiness.businessName,
		subtitle: isVendorSide
			? location(conv.wedding.city, conv.wedding.region)
			: location(conv.vendorBusiness.city, conv.vendorBusiness.region),
		// Couples see the vendor's logo; vendors have no couple avatar.
		avatarUrl: isVendorSide
			? null
			: await presignImage(conv.vendorBusiness.logo),
		lastMessageAt: conv.lastMessageAt,
		lastMessagePreview,
		unreadCount,
	};
}

/** The conversation + the caller's participant row, or NOT_FOUND if not a member. */
async function getMembership(dbUserId: number, conversationUuid: string) {
	const conv = await db.query.conversations.findFirst({
		where: eq(conversations.uuid, conversationUuid),
		...conversationWith,
	});
	if (!conv) {
		throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
	}
	const participant = await db.query.conversationParticipants.findFirst({
		where: and(
			eq(conversationParticipants.conversationId, conv.id),
			eq(conversationParticipants.userId, dbUserId),
		),
		columns: { id: true, lastReadAt: true },
	});
	if (!participant) {
		// Don't leak the existence of threads the caller isn't part of.
		throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
	}
	return { conv, participant };
}

/**
 * Summaries for the caller's conversations. Thread/message volume per user is
 * modest (a handful of vendors), so previews + unread are reduced in memory
 * from one message read rather than a query per thread.
 */
async function summarizeThreads(
	dbUserId: number,
	conversationIds: number[],
	lastReadByConversation: Map<number, Date | null>,
): Promise<ThreadSummarySchema[]> {
	if (conversationIds.length === 0) return [];

	const [convs, msgRows] = await Promise.all([
		db.query.conversations.findMany({
			where: inArray(conversations.id, conversationIds),
			...conversationWith,
		}),
		db
			.select({
				conversationId: messages.conversationId,
				senderUserId: messages.senderUserId,
				body: messages.body,
				createdAt: messages.createdAt,
			})
			.from(messages)
			.where(
				and(
					inArray(messages.conversationId, conversationIds),
					isNull(messages.deletedAt),
				),
			)
			.orderBy(asc(messages.createdAt)),
	]);

	const preview = new Map<number, string>();
	const unread = new Map<number, number>();
	for (const m of msgRows) {
		preview.set(m.conversationId, m.body); // ascending → last write wins
		const lastRead = lastReadByConversation.get(m.conversationId) ?? null;
		const isUnread =
			m.senderUserId !== dbUserId &&
			(lastRead === null || m.createdAt > lastRead);
		if (isUnread) {
			unread.set(m.conversationId, (unread.get(m.conversationId) ?? 0) + 1);
		}
	}

	const summaries = await Promise.all(
		convs.map((conv) =>
			buildSummary(
				conv,
				dbUserId,
				unread.get(conv.id) ?? 0,
				preview.get(conv.id) ?? null,
			),
		),
	);

	// Most-recently-active first; threads with no messages sink to the bottom.
	summaries.sort((a, b) => {
		const at = a.lastMessageAt?.getTime() ?? 0;
		const bt = b.lastMessageAt?.getTime() ?? 0;
		return bt - at;
	});
	return summaries;
}

export async function listThreads(dbUserId: number): Promise<ThreadListSchema> {
	const memberships = await db
		.select({
			conversationId: conversationParticipants.conversationId,
			lastReadAt: conversationParticipants.lastReadAt,
		})
		.from(conversationParticipants)
		.where(eq(conversationParticipants.userId, dbUserId));

	const ids = memberships.map((m) => m.conversationId);
	const lastReadByConversation = new Map(
		memberships.map((m) => [m.conversationId, m.lastReadAt]),
	);
	return {
		items: await summarizeThreads(dbUserId, ids, lastReadByConversation),
	};
}

export async function getThread(
	dbUserId: number,
	conversationUuid: string,
): Promise<ThreadDetailSchema> {
	const { conv, participant } = await getMembership(dbUserId, conversationUuid);

	const rows = await db.query.messages.findMany({
		where: and(
			eq(messages.conversationId, conv.id),
			isNull(messages.deletedAt),
		),
		orderBy: [asc(messages.createdAt), asc(messages.id)],
		columns: { uuid: true, body: true, senderUserId: true, createdAt: true },
		with: { sender: { columns: { name: true } } },
	});

	const list: MessageSchema[] = rows.map((m) => ({
		uuid: m.uuid,
		body: m.body,
		senderName: m.sender?.name ?? "Member",
		isMine: m.senderUserId === dbUserId,
		sentAt: m.createdAt,
	}));

	const unread = list.filter(
		(m) =>
			!m.isMine &&
			(participant.lastReadAt === null || m.sentAt > participant.lastReadAt),
	).length;

	const thread = await buildSummary(
		conv,
		dbUserId,
		unread,
		list.at(-1)?.body ?? null,
	);
	return { thread, messages: list };
}

export async function sendMessage(
	dbUserId: number,
	input: SendMessageInputSchema,
): Promise<MessageSchema> {
	const { conv } = await getMembership(dbUserId, input.conversationUuid);
	const now = new Date();

	const [row] = await db
		.insert(messages)
		.values({
			conversationId: conv.id,
			senderUserId: dbUserId,
			body: input.body,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})
		.returning({ uuid: messages.uuid, createdAt: messages.createdAt });
	if (!row) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to send message",
		});
	}

	await Promise.all([
		db
			.update(conversations)
			.set({ lastMessageAt: now, updatedBy: dbUserId, updatedAt: now })
			.where(eq(conversations.id, conv.id)),
		// Sending implies reading everything up to now.
		db
			.update(conversationParticipants)
			.set({ lastReadAt: now })
			.where(
				and(
					eq(conversationParticipants.conversationId, conv.id),
					eq(conversationParticipants.userId, dbUserId),
				),
			),
	]);

	const me = await db.query.users.findFirst({
		where: eq(users.id, dbUserId),
		columns: { name: true },
	});
	return {
		uuid: row.uuid,
		body: input.body,
		senderName: me?.name ?? "You",
		isMine: true,
		sentAt: row.createdAt,
	};
}

export async function markRead(dbUserId: number, conversationUuid: string) {
	const { conv } = await getMembership(dbUserId, conversationUuid);
	await db
		.update(conversationParticipants)
		.set({ lastReadAt: new Date() })
		.where(
			and(
				eq(conversationParticipants.conversationId, conv.id),
				eq(conversationParticipants.userId, dbUserId),
			),
		);
	return { unreadCount: 0 };
}

/**
 * Open (or reopen) the thread between the caller's wedding and a vendor. Gated:
 * the vendor must already be saved or booked — vendors can't be cold-messaged.
 */
export async function startThread(
	dbUserId: number,
	vendorBusinessUuid: string,
): Promise<ThreadSummarySchema> {
	const wedding = await db.query.weddings.findFirst({
		where: coupleWeddingWhere(dbUserId),
		columns: { id: true, ownerUserId: true, partnerUserId: true },
	});
	if (!wedding) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}

	const business = await db.query.vendorBusinesses.findFirst({
		where: and(
			eq(vendorBusinesses.uuid, vendorBusinessUuid),
			isNull(vendorBusinesses.deletedAt),
		),
		columns: { id: true },
		with: { account: { columns: { userId: true } } },
	});
	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
	}

	const [saved, booked] = await Promise.all([
		db.query.savedVendors.findFirst({
			where: and(
				eq(savedVendors.weddingId, wedding.id),
				eq(savedVendors.vendorBusinessId, business.id),
				isNull(savedVendors.deletedAt),
			),
			columns: { id: true },
		}),
		db.query.bookings.findFirst({
			where: and(
				eq(bookings.weddingId, wedding.id),
				eq(bookings.vendorBusinessId, business.id),
				isNull(bookings.deletedAt),
			),
			columns: { id: true },
		}),
	]);
	if (!saved && !booked) {
		throw new ORPCError("FORBIDDEN", {
			message: "Save or book this vendor before messaging them.",
		});
	}

	await db
		.insert(conversations)
		.values({
			weddingId: wedding.id,
			vendorBusinessId: business.id,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})
		.onConflictDoNothing({
			target: [conversations.weddingId, conversations.vendorBusinessId],
		});
	const conv = await db.query.conversations.findFirst({
		where: and(
			eq(conversations.weddingId, wedding.id),
			eq(conversations.vendorBusinessId, business.id),
		),
		columns: { id: true },
	});
	if (!conv) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to open conversation",
		});
	}

	const participantIds = [
		wedding.ownerUserId,
		wedding.partnerUserId,
		business.account.userId,
	].filter((id): id is number => id !== null);
	await db
		.insert(conversationParticipants)
		.values(
			participantIds.map((userId) => ({ conversationId: conv.id, userId })),
		)
		.onConflictDoNothing({
			target: [
				conversationParticipants.conversationId,
				conversationParticipants.userId,
			],
		});

	const [summary] = await summarizeThreads(
		dbUserId,
		[conv.id],
		new Map([[conv.id, null]]),
	);
	if (!summary) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to open conversation",
		});
	}
	return summary;
}
