import { ORPCError } from "@orpc/server";
import type { SubscriptionTier } from "@repo/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, files, vendorAccounts, vendorBusinesses } from "../../db";
import { createPresignedUrl } from "../../storage";
import { logger } from "../../utils/logger";

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

/** Presigned logo URLs keyed by file id, resolving nulls (and blanks) to null. */
export async function presignLogosByFileId(
	fileIds: (number | null)[],
): Promise<Map<number, string | null>> {
	const urlByFileId = new Map<number, string | null>();
	const ids = fileIds.filter((id): id is number => id !== null);
	if (ids.length === 0) return urlByFileId;

	const rows = await db
		.select({ id: files.id, key: files.key, fileName: files.fileName })
		.from(files)
		.where(inArray(files.id, ids));
	await Promise.all(
		rows.map(async (file) => {
			urlByFileId.set(file.id, await presignImage(file));
		}),
	);
	return urlByFileId;
}

/** The tier-limit message shown when a vendor hits their service cap. */
export function maxServicesMessage(maxServices: number) {
	return `Your plan allows up to ${maxServices} service${maxServices === 1 ? "" : "s"}. Upgrade to add more.`;
}

/** The caller's vendor account (id + subscription tier), or throw NOT_FOUND. */
export async function getVendorAccount(dbUserId: number) {
	const account = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.userId, dbUserId),
		columns: { id: true, subscriptionTier: true },
	});
	if (!account) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor account not found" });
	}
	return account;
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
	const account = await getVendorAccount(dbUserId);
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
