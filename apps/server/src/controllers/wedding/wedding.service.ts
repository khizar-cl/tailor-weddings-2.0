import { ORPCError } from "@orpc/server";
import type { WeddingSummarySchema } from "@repo/shared";
import { and, asc, count, desc, eq, isNull, ne, or } from "drizzle-orm";
import {
	bookings,
	budgetItems,
	checklistItems,
	db,
	savedVendors,
	vendorRecommendations,
	weddings,
} from "../../db";

const DASHBOARD_RECOMMENDATION_LIMIT = 6;

/**
 * Resolve the wedding the caller can read. The owner has write access and the
 * partner read-only, so both may see the dashboard (see wedding.schema).
 */
async function getReadableWedding(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: and(
			or(
				eq(weddings.ownerUserId, dbUserId),
				eq(weddings.partnerUserId, dbUserId),
			),
			isNull(weddings.deletedAt),
		),
		columns: {
			id: true,
			weddingDate: true,
			city: true,
			region: true,
			guestCountEstimate: true,
			estimatedBudgetCents: true,
		},
	});
	if (!wedding) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}
	return wedding;
}

export async function getWeddingSummary(
	dbUserId: number,
): Promise<WeddingSummarySchema> {
	const wedding = await getReadableWedding(dbUserId);

	const [checklistTotal, checklistDone, budgetLines, saved, booked, recs] =
		await Promise.all([
			db
				.select({ value: count() })
				.from(checklistItems)
				.where(
					and(
						eq(checklistItems.weddingId, wedding.id),
						isNull(checklistItems.deletedAt),
					),
				),
			db
				.select({ value: count() })
				.from(checklistItems)
				.where(
					and(
						eq(checklistItems.weddingId, wedding.id),
						eq(checklistItems.isComplete, true),
						isNull(checklistItems.deletedAt),
					),
				),
			db
				.select({ actualCents: budgetItems.actualCents })
				.from(budgetItems)
				.where(
					and(
						eq(budgetItems.weddingId, wedding.id),
						isNull(budgetItems.deletedAt),
					),
				),
			db
				.select({ vendorBusinessId: savedVendors.vendorBusinessId })
				.from(savedVendors)
				.where(
					and(
						eq(savedVendors.weddingId, wedding.id),
						isNull(savedVendors.deletedAt),
					),
				),
			db
				.select({ vendorBusinessId: bookings.vendorBusinessId })
				.from(bookings)
				.where(
					and(
						eq(bookings.weddingId, wedding.id),
						ne(bookings.status, "cancelled"),
						isNull(bookings.deletedAt),
					),
				),
			db.query.vendorRecommendations.findMany({
				where: and(
					eq(vendorRecommendations.weddingId, wedding.id),
					eq(vendorRecommendations.status, "suggested"),
					isNull(vendorRecommendations.deletedAt),
				),
				orderBy: [
					desc(vendorRecommendations.matchScore),
					asc(vendorRecommendations.id),
				],
				limit: DASHBOARD_RECOMMENDATION_LIMIT,
				with: {
					vendorBusiness: {
						columns: {
							uuid: true,
							businessName: true,
							region: true,
							isVerified: true,
							deletedAt: true,
						},
					},
					category: { columns: { name: true } },
				},
			}),
		]);

	const paidCents = budgetLines.reduce(
		(sum, line) => sum + (line.actualCents ?? 0),
		0,
	);

	const teamBusinessIds = new Set<number>();
	for (const row of saved) teamBusinessIds.add(row.vendorBusinessId);
	for (const row of booked) teamBusinessIds.add(row.vendorBusinessId);

	const recommendations = recs
		.filter((rec) => rec.vendorBusiness?.deletedAt === null)
		.map((rec) => ({
			uuid: rec.uuid,
			vendorBusinessUuid: rec.vendorBusiness.uuid,
			businessName: rec.vendorBusiness.businessName,
			region: rec.vendorBusiness.region,
			isVerified: rec.vendorBusiness.isVerified,
			categoryName: rec.category?.name ?? null,
			matchScore: rec.matchScore,
			rationale: rec.rationale,
		}));

	return {
		wedding: {
			weddingDate: wedding.weddingDate,
			city: wedding.city,
			region: wedding.region,
			guestCountEstimate: wedding.guestCountEstimate,
		},
		checklist: {
			done: checklistDone[0]?.value ?? 0,
			total: checklistTotal[0]?.value ?? 0,
		},
		budget: {
			estimatedCents: wedding.estimatedBudgetCents,
			paidCents,
		},
		teamCount: teamBusinessIds.size,
		recommendations,
	};
}
