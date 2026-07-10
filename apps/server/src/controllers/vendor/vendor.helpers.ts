import { ORPCError } from "@orpc/server";
import type { SubscriptionTier } from "@repo/shared";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, vendorAccounts, vendorBusinesses, weddings } from "../../db";
import { createPresignedUrl } from "../../storage";
import { logger } from "../../utils/logger";

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

/**
 * Presigned view URL for a public listing image, or null when absent. A failure
 * to sign (e.g. storage not configured) degrades to null rather than failing the
 * whole listing read — a missing image is recoverable, a 500 is not.
 */
export async function presignImage(
	file: { key: string; fileName: string } | null | undefined,
) {
	if (!file) return null;
	try {
		return await createPresignedUrl(file.key, file.fileName, "view");
	} catch (error) {
		logger.warn({ error }, "Failed to presign listing image");
		return null;
	}
}

export interface OwnedBusiness {
	businessId: number;
	tier: SubscriptionTier;
}

/**
 * The caller's own business (via their vendor account), plus the subscription
 * tier that gates its limits. Throws if the vendor hasn't created a business.
 */
export async function getOwnedBusiness(
	dbUserId: number,
): Promise<OwnedBusiness> {
	const account = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.userId, dbUserId),
		columns: { id: true, subscriptionTier: true },
	});
	if (!account) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor account not found" });
	}
	const business = await db.query.vendorBusinesses.findFirst({
		where: and(
			eq(vendorBusinesses.vendorAccountId, account.id),
			isNull(vendorBusinesses.deletedAt),
		),
		columns: { id: true },
	});
	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor business not found" });
	}
	return { businessId: business.id, tier: account.subscriptionTier };
}
