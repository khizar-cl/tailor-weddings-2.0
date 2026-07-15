import { ORPCError } from "@orpc/server";
import type {
	ListReviewsInputSchema,
	ModerateReviewInputSchema,
	PendingReviewRequestListSchema,
	ReviewListSchema,
	ReviewSchema,
	SubmitReviewInputSchema,
} from "@repo/shared";
import { subDays } from "date-fns";
import {
	and,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lte,
} from "drizzle-orm";
import {
	bookings,
	db,
	reviewRequests,
	reviews,
	vendorAccounts,
	vendorBusinesses,
	weddings,
} from "../../db";
import { getOwnedBusiness } from "../vendor/vendor.helpers";

/** How long after the wedding requests go out, and reviews come off embargo. */
const REQUEST_AFTER_DAYS = 1;
const PUBLISH_AFTER_DAYS = 7;
/** Don't retroactively generate requests for weddings older than this. */
const REQUEST_LOOKBACK_DAYS = 30;

const reviewCardWith = {
	columns: {
		uuid: true,
		type: true,
		overallRating: true,
		ratings: true,
		body: true,
		publishedAt: true,
	},
	with: {
		authorVendorBusiness: { columns: { businessName: true } },
		wedding: {
			columns: {},
			with: {
				owner: { columns: { name: true } },
				partner: { columns: { name: true } },
			},
		},
	},
} as const;

type ReviewCardRow = NonNullable<Awaited<ReturnType<typeof loadReviewCard>>>;

/** First name only — reviews show "Amara & Theo", never full surnames. */
function firstName(name: string | null | undefined): string | null {
	return name?.trim().split(/\s+/)[0] ?? null;
}

function coupleName(wedding: ReviewCardRow["wedding"]): string {
	return (
		[firstName(wedding.owner?.name), firstName(wedding.partner?.name)]
			.filter(Boolean)
			.join(" & ") || "A couple"
	);
}

function buildReviewCard(row: ReviewCardRow): ReviewSchema {
	return {
		uuid: row.uuid,
		type: row.type,
		authorName:
			row.type === "peer"
				? (row.authorVendorBusiness?.businessName ?? "A vendor")
				: coupleName(row.wedding),
		overallRating: row.overallRating,
		ratings: row.ratings ?? null,
		body: row.body,
		publishedAt: row.publishedAt,
	};
}

function loadReviewCard(reviewId: number) {
	return db.query.reviews.findFirst({
		where: eq(reviews.id, reviewId),
		...reviewCardWith,
	});
}

/** A live vendor business by external uuid, or NOT_FOUND. */
async function getBusinessByUuid(uuid: string) {
	const business = await db.query.vendorBusinesses.findFirst({
		where: and(
			eq(vendorBusinesses.uuid, uuid),
			isNull(vendorBusinesses.deletedAt),
		),
		columns: { id: true },
	});
	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
	}
	return business;
}

export async function listForBusiness(
	input: ListReviewsInputSchema,
): Promise<ReviewListSchema> {
	const business = await getBusinessByUuid(input.vendorBusinessUuid);
	const rows = await db.query.reviews.findMany({
		where: and(
			eq(reviews.subjectVendorBusinessId, business.id),
			eq(reviews.status, "published"),
			input.type ? eq(reviews.type, input.type) : undefined,
			isNull(reviews.deletedAt),
		),
		orderBy: [desc(reviews.publishedAt), desc(reviews.id)],
		...reviewCardWith,
	});
	return { items: rows.map(buildReviewCard) };
}

export async function listMyRequests(
	dbUserId: number,
): Promise<PendingReviewRequestListSchema> {
	const rows = await db.query.reviewRequests.findMany({
		where: and(
			eq(reviewRequests.targetUserId, dbUserId),
			eq(reviewRequests.status, "sent"),
		),
		orderBy: [desc(reviewRequests.sentAt), desc(reviewRequests.id)],
		columns: { uuid: true, type: true, sentAt: true },
		with: {
			subjectVendorBusiness: { columns: { uuid: true, businessName: true } },
			wedding: { columns: { weddingDate: true } },
		},
	});
	return {
		items: rows.map((row) => ({
			uuid: row.uuid,
			type: row.type,
			subjectVendorBusinessUuid: row.subjectVendorBusiness.uuid,
			subjectBusinessName: row.subjectVendorBusiness.businessName,
			weddingDate: row.wedding.weddingDate,
			sentAt: row.sentAt,
		})),
	};
}

/**
 * Submit a review against a request the caller was sent. The request is the
 * verification anchor — it only exists for a party with a confirmed booking on
 * the subject's wedding — so no separate eligibility check is needed here. The
 * review lands `pending` (embargoed until the T+7 publish job).
 */
export async function submitReview(
	dbUserId: number,
	input: SubmitReviewInputSchema,
): Promise<ReviewSchema> {
	const request = await db.query.reviewRequests.findFirst({
		where: eq(reviewRequests.uuid, input.reviewRequestUuid),
		columns: {
			id: true,
			type: true,
			status: true,
			targetUserId: true,
			subjectVendorBusinessId: true,
			weddingId: true,
		},
	});
	// Don't leak requests that aren't the caller's.
	if (!request || request.targetUserId !== dbUserId) {
		throw new ORPCError("NOT_FOUND", { message: "Review request not found" });
	}
	if (request.status !== "sent") {
		throw new ORPCError("CONFLICT", {
			message: "This review has already been submitted.",
		});
	}

	// Peer reviews record the author's business; client reviews don't have one.
	const authorVendorBusinessId =
		request.type === "peer"
			? (await getOwnedBusiness(dbUserId)).businessId
			: null;

	const now = new Date();
	const [inserted] = await db
		.insert(reviews)
		.values({
			reviewRequestId: request.id,
			type: request.type,
			authorUserId: dbUserId,
			authorVendorBusinessId,
			subjectVendorBusinessId: request.subjectVendorBusinessId,
			weddingId: request.weddingId,
			overallRating: input.overallRating,
			ratings: input.ratings ?? null,
			body: input.body ?? null,
			status: "pending",
			verifiedAt: now,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})
		.onConflictDoNothing({
			target: [
				reviews.authorUserId,
				reviews.subjectVendorBusinessId,
				reviews.weddingId,
			],
		})
		.returning({ id: reviews.id });
	if (!inserted) {
		throw new ORPCError("CONFLICT", {
			message: "You've already reviewed this vendor for this wedding.",
		});
	}

	await db
		.update(reviewRequests)
		.set({ status: "completed", completedAt: now, updatedBy: dbUserId })
		.where(eq(reviewRequests.id, request.id));

	const card = await loadReviewCard(inserted.id);
	if (!card) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to load review",
		});
	}
	return buildReviewCard(card);
}

/** Admin moderation — reject/flag, or force-publish. Gated at the controller. */
export async function moderateReview(
	dbUserId: number,
	input: ModerateReviewInputSchema,
): Promise<ReviewSchema> {
	const now = new Date();
	const [row] = await db
		.update(reviews)
		.set({
			status: input.status,
			publishedAt: input.status === "published" ? now : null,
			updatedBy: dbUserId,
			updatedAt: now,
		})
		.where(and(eq(reviews.uuid, input.reviewUuid), isNull(reviews.deletedAt)))
		.returning({ id: reviews.id });
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Review not found" });
	}
	const card = await loadReviewCard(row.id);
	if (!card) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to load review",
		});
	}
	return buildReviewCard(card);
}

/**
 * T+1 job. For each wedding whose date was at least a day ago (bounded to the
 * recent past), create the review requests its confirmed bookings authorize:
 * the couple may review each booked vendor (client), and each booked vendor may
 * review the others (peer). Idempotent via the request uniqueness, so re-runs
 * add nothing. `now` is injected so the window is testable without wall-clock.
 */
export async function generateReviewRequests(
	now: Date,
): Promise<{ created: number }> {
	const eligibleWeddings = await db
		.select({ id: weddings.id, ownerUserId: weddings.ownerUserId })
		.from(weddings)
		.where(
			and(
				isNotNull(weddings.weddingDate),
				lte(weddings.weddingDate, subDays(now, REQUEST_AFTER_DAYS)),
				gte(weddings.weddingDate, subDays(now, REQUEST_LOOKBACK_DAYS)),
				isNull(weddings.deletedAt),
			),
		);

	const rows: Array<{
		weddingId: number;
		subjectVendorBusinessId: number;
		targetUserId: number;
		type: "peer" | "client";
	}> = [];

	for (const wedding of eligibleWeddings) {
		// Each booked business + the user who owns it (for peer targeting).
		const booked = await db
			.selectDistinct({
				businessId: bookings.vendorBusinessId,
				vendorUserId: vendorAccounts.userId,
			})
			.from(bookings)
			.innerJoin(
				vendorBusinesses,
				eq(vendorBusinesses.id, bookings.vendorBusinessId),
			)
			.innerJoin(
				vendorAccounts,
				eq(vendorAccounts.id, vendorBusinesses.vendorAccountId),
			)
			.where(
				and(
					eq(bookings.weddingId, wedding.id),
					eq(bookings.status, "confirmed"),
					isNull(bookings.deletedAt),
				),
			);

		for (const subject of booked) {
			// Client: the couple reviews the booked vendor.
			rows.push({
				weddingId: wedding.id,
				subjectVendorBusinessId: subject.businessId,
				targetUserId: wedding.ownerUserId,
				type: "client",
			});
			// Peer: every other booked vendor may review this subject.
			for (const author of booked) {
				if (author.businessId === subject.businessId) continue;
				rows.push({
					weddingId: wedding.id,
					subjectVendorBusinessId: subject.businessId,
					targetUserId: author.vendorUserId,
					type: "peer",
				});
			}
		}
	}

	if (rows.length === 0) return { created: 0 };

	const inserted = await db
		.insert(reviewRequests)
		.values(rows)
		.onConflictDoNothing({
			target: [
				reviewRequests.weddingId,
				reviewRequests.subjectVendorBusinessId,
				reviewRequests.targetUserId,
			],
		})
		.returning({ id: reviewRequests.id });

	return { created: inserted.length };
}

/**
 * T+7 job. Lift the embargo: publish every still-`pending` review whose wedding
 * is at least a week past, in one batch, so a wedding's reviews surface
 * together. Idempotent (only pending rows move) and catches late submissions.
 */
export async function publishDueReviews(
	now: Date,
): Promise<{ published: number }> {
	const dueWeddings = db
		.select({ id: weddings.id })
		.from(weddings)
		.where(lte(weddings.weddingDate, subDays(now, PUBLISH_AFTER_DAYS)));

	const published = await db
		.update(reviews)
		.set({ status: "published", publishedAt: now, updatedAt: now })
		.where(
			and(
				eq(reviews.status, "pending"),
				inArray(reviews.weddingId, dueWeddings),
				isNull(reviews.deletedAt),
			),
		)
		.returning({ id: reviews.id });

	return { published: published.length };
}
