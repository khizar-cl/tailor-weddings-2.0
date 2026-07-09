import { ORPCError } from "@orpc/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, weddings } from "../../db";
import { createPresignedUrl } from "../../storage";

/**
 * The wedding the caller can act on for team/discovery. Owner and partner both
 * manage the shortlist, so either resolves it (see wedding.schema).
 */
export async function getCoupleWeddingIdOrNull(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: and(
			or(
				eq(weddings.ownerUserId, dbUserId),
				eq(weddings.partnerUserId, dbUserId),
			),
			isNull(weddings.deletedAt),
		),
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

/** Presigned view URL for a public listing image, or null when absent. */
export async function presignImage(
	file: { key: string; fileName: string } | null | undefined,
) {
	if (!file) return null;
	return createPresignedUrl(file.key, file.fileName, "view");
}
