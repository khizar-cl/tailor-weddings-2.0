import { addDays } from "date-fns";
import { and, asc, eq, inArray, like } from "drizzle-orm";
import { logger } from "../../utils/logger";
import {
	bookings,
	db,
	reviewRequests,
	reviews,
	servicePackages,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
	weddings,
} from "..";

export type SeedReview = {
	/** Index into the seeded vendor catalogue (their `seed_vendor_gen_<i>` id). */
	vendorIndex: number;
	overallRating: number;
	ratings: Record<string, number>;
	body: string;
};

export type SeedPeerReview = {
	authorVendorIndex: number;
	subjectVendorIndex: number;
	overallRating: number;
	ratings: Record<string, number>;
	body: string;
};

export type SeedCouple = {
	/** Deterministic Clerk id so reruns resolve the same user (idempotency key). */
	clerkId: string;
	email: string;
	name: string;
	partner: { clerkId: string; email: string; name: string } | null;
	wedding: {
		weddingDate: Date;
		city: string;
		region: string;
		estimatedBudgetCents: number;
		guestCountEstimate: number;
		styleTags: string[];
		stylePalette: string[];
	};
	bookedVendorIndices: number[];
	clientReviews: SeedReview[];
	peerReviews: SeedPeerReview[];
};

/** A seeded vendor resolved to the ids the couple seed needs to link against. */
interface SeededVendor {
	businessId: number;
	vendorUserId: number;
	/** Cheapest live package — the booking's target. Null if the vendor has none. */
	packageId: number | null;
}

const SEED_VENDOR_PREFIX = "seed_vendor_gen_";

/**
 * The seeded vendors, keyed by their generator index (parsed from the Clerk id)
 * so a couple's `vendorIndex` maps to the same vendor every run. Each carries a
 * package to book against.
 */
async function loadSeededVendorsByIndex(): Promise<Map<number, SeededVendor>> {
	const rows = await db
		.select({
			businessId: vendorBusinesses.id,
			vendorUserId: vendorAccounts.userId,
			clerkId: users.clerkId,
		})
		.from(vendorBusinesses)
		.innerJoin(
			vendorAccounts,
			eq(vendorAccounts.id, vendorBusinesses.vendorAccountId),
		)
		.innerJoin(users, eq(users.id, vendorAccounts.userId))
		.where(like(users.clerkId, `${SEED_VENDOR_PREFIX}%`));

	const businessIds = rows.map((r) => r.businessId);
	const packageByBusiness = new Map<number, number>();
	if (businessIds.length > 0) {
		// Cheapest package per business wins (ascending price, first seen keeps).
		const pkgs = await db
			.select({
				packageId: servicePackages.id,
				businessId: vendorServices.vendorBusinessId,
			})
			.from(servicePackages)
			.innerJoin(
				vendorServices,
				eq(vendorServices.id, servicePackages.vendorServiceId),
			)
			.where(inArray(vendorServices.vendorBusinessId, businessIds))
			.orderBy(asc(servicePackages.priceCents), asc(servicePackages.id));
		for (const pkg of pkgs) {
			if (!packageByBusiness.has(pkg.businessId)) {
				packageByBusiness.set(pkg.businessId, pkg.packageId);
			}
		}
	}

	const byIndex = new Map<number, SeededVendor>();
	for (const row of rows) {
		const index = Number(row.clerkId.slice(SEED_VENDOR_PREFIX.length));
		if (!Number.isInteger(index)) continue;
		byIndex.set(index, {
			businessId: row.businessId,
			vendorUserId: row.vendorUserId,
			packageId: packageByBusiness.get(row.businessId) ?? null,
		});
	}
	return byIndex;
}

async function upsertUser(user: {
	clerkId: string;
	email: string;
	name: string;
}): Promise<number> {
	await db
		.insert(users)
		.values(user)
		.onConflictDoNothing({ target: users.clerkId });
	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.clerkId, user.clerkId));
	if (!row) throw new Error(`Failed to upsert seed user ${user.clerkId}`);
	return row.id;
}

async function upsertWedding(
	couple: SeedCouple,
	ownerUserId: number,
	partnerUserId: number | null,
): Promise<number> {
	await db
		.insert(weddings)
		.values({
			ownerUserId,
			partnerUserId,
			weddingDate: couple.wedding.weddingDate,
			estimatedBudgetCents: couple.wedding.estimatedBudgetCents,
			guestCountEstimate: couple.wedding.guestCountEstimate,
			city: couple.wedding.city,
			region: couple.wedding.region,
			styleTags: couple.wedding.styleTags,
			stylePalette: couple.wedding.stylePalette,
			status: "complete",
		})
		.onConflictDoNothing({ target: weddings.ownerUserId });
	const [row] = await db
		.select({ id: weddings.id })
		.from(weddings)
		.where(eq(weddings.ownerUserId, ownerUserId));
	if (!row) throw new Error(`Failed to upsert wedding for user ${ownerUserId}`);
	return row.id;
}

async function confirmBooking(
	weddingId: number,
	vendor: SeededVendor,
	bookedAt: Date,
) {
	if (vendor.packageId === null) return;
	await db
		.insert(bookings)
		.values({
			weddingId,
			vendorBusinessId: vendor.businessId,
			servicePackageId: vendor.packageId,
			status: "confirmed",
			bookedAt,
			confirmedAt: bookedAt,
		})
		.onConflictDoNothing({
			target: [bookings.weddingId, bookings.servicePackageId],
		});
}

/** Insert a completed request + published review, idempotently. */
async function seedReview(params: {
	weddingId: number;
	type: "client" | "peer";
	authorUserId: number;
	authorVendorBusinessId: number | null;
	subjectVendorBusinessId: number;
	targetUserId: number;
	overallRating: number;
	ratings: Record<string, number>;
	body: string;
	publishedAt: Date;
}) {
	await db
		.insert(reviewRequests)
		.values({
			weddingId: params.weddingId,
			subjectVendorBusinessId: params.subjectVendorBusinessId,
			targetUserId: params.targetUserId,
			type: params.type,
			status: "completed",
			completedAt: params.publishedAt,
		})
		.onConflictDoNothing({
			target: [
				reviewRequests.weddingId,
				reviewRequests.subjectVendorBusinessId,
				reviewRequests.targetUserId,
			],
		});
	const [request] = await db
		.select({ id: reviewRequests.id })
		.from(reviewRequests)
		.where(
			and(
				eq(reviewRequests.weddingId, params.weddingId),
				eq(
					reviewRequests.subjectVendorBusinessId,
					params.subjectVendorBusinessId,
				),
				eq(reviewRequests.targetUserId, params.targetUserId),
			),
		);

	await db
		.insert(reviews)
		.values({
			reviewRequestId: request?.id ?? null,
			type: params.type,
			authorUserId: params.authorUserId,
			authorVendorBusinessId: params.authorVendorBusinessId,
			subjectVendorBusinessId: params.subjectVendorBusinessId,
			weddingId: params.weddingId,
			overallRating: params.overallRating,
			ratings: params.ratings,
			body: params.body || null,
			status: "published",
			verifiedAt: params.publishedAt,
			publishedAt: params.publishedAt,
			createdBy: params.authorUserId,
			updatedBy: params.authorUserId,
		})
		.onConflictDoNothing({
			target: [
				reviews.authorUserId,
				reviews.subjectVendorBusinessId,
				reviews.weddingId,
			],
		});
}

/**
 * Idempotent — safe to run repeatedly. Requires seedVendors to have run so the
 * `seed_vendor_gen_*` catalogue exists to book and review.
 */
export async function seedCouples(couples: readonly SeedCouple[]) {
	const vendorsByIndex = await loadSeededVendorsByIndex();
	if (vendorsByIndex.size === 0) {
		logger.warn("No seeded vendors found — skipping couple seed");
		return;
	}

	let bookingCount = 0;
	let reviewCount = 0;

	for (const couple of couples) {
		const ownerUserId = await upsertUser({
			clerkId: couple.clerkId,
			email: couple.email,
			name: couple.name,
		});
		const partnerUserId = couple.partner
			? await upsertUser(couple.partner)
			: null;
		const weddingId = await upsertWedding(couple, ownerUserId, partnerUserId);

		// Reviews surface a week after the wedding, matching the publish embargo.
		const publishedAt = addDays(couple.wedding.weddingDate, 7);

		for (const index of couple.bookedVendorIndices) {
			const vendor = vendorsByIndex.get(index);
			if (!vendor) continue;
			await confirmBooking(weddingId, vendor, couple.wedding.weddingDate);
			bookingCount++;
		}

		for (const review of couple.clientReviews) {
			const vendor = vendorsByIndex.get(review.vendorIndex);
			if (!vendor) continue;
			await seedReview({
				weddingId,
				type: "client",
				authorUserId: ownerUserId,
				authorVendorBusinessId: null,
				subjectVendorBusinessId: vendor.businessId,
				targetUserId: ownerUserId,
				overallRating: review.overallRating,
				ratings: review.ratings,
				body: review.body,
				publishedAt,
			});
			reviewCount++;
		}

		for (const peer of couple.peerReviews) {
			const author = vendorsByIndex.get(peer.authorVendorIndex);
			const subject = vendorsByIndex.get(peer.subjectVendorIndex);
			if (!author || !subject) continue;
			await seedReview({
				weddingId,
				type: "peer",
				authorUserId: author.vendorUserId,
				authorVendorBusinessId: author.businessId,
				subjectVendorBusinessId: subject.businessId,
				targetUserId: author.vendorUserId,
				overallRating: peer.overallRating,
				ratings: peer.ratings,
				body: peer.body,
				publishedAt,
			});
			reviewCount++;
		}
	}

	logger.info(
		{ couples: couples.length, bookings: bookingCount, reviews: reviewCount },
		"Seeded couples, weddings, bookings, and reviews",
	);
}
