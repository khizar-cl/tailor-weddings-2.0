import { ORPCError } from "@orpc/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, weddings } from "../../db";

/** Live wedding the caller owns. Owners have write access; partners do not. */
export function ownedWeddingWhere(dbUserId: number) {
	return and(eq(weddings.ownerUserId, dbUserId), isNull(weddings.deletedAt));
}

/**
 * Live wedding the caller owns or partners on. Both may read; the partner has
 * read-only access (see wedding.schema).
 */
export function coupleWeddingWhere(dbUserId: number) {
	return and(
		or(
			eq(weddings.ownerUserId, dbUserId),
			eq(weddings.partnerUserId, dbUserId),
		),
		isNull(weddings.deletedAt),
	);
}

/** Owner-only wedding id, for writes gated to the owner. */
export async function getOwnedWeddingId(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: ownedWeddingWhere(dbUserId),
		columns: { id: true },
	});
	if (!wedding) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}
	return wedding.id;
}

export async function getCoupleWeddingIdOrNull(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: coupleWeddingWhere(dbUserId),
		columns: { id: true },
	});
	return wedding?.id ?? null;
}

export async function getCoupleWeddingId(dbUserId: number) {
	const weddingId = await getCoupleWeddingIdOrNull(dbUserId);
	if (weddingId === null) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}
	return weddingId;
}
