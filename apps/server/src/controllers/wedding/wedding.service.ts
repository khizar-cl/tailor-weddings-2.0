import { ORPCError } from "@orpc/server";
import type {
	BookingStatus,
	WeddingSummarySchema,
	WeddingTeamMemberSchema,
	WeddingTeamSchema,
} from "@repo/shared";
import { and, asc, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import {
	bookings,
	budgetItems,
	categories,
	checklistItems,
	db,
	savedVendors,
	vendorRecommendations,
	vendorServices,
} from "../../db";
import { presignLogosByFileId } from "../vendor/vendor.helpers";
import { coupleWeddingWhere } from "./wedding-access";

const DASHBOARD_RECOMMENDATION_LIMIT = 6;

/**
 * Resolve the wedding the caller can read. The owner has write access and the
 * partner read-only, so both may see the dashboard (see wedding.schema).
 */
async function getReadableWedding(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: coupleWeddingWhere(dbUserId),
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

export async function getWeddingTeam(
	dbUserId: number,
): Promise<WeddingTeamSchema> {
	const wedding = await getReadableWedding(dbUserId);

	const [savedRows, bookedRows, activeCategories] = await Promise.all([
		db
			.select({ vendorBusinessId: savedVendors.vendorBusinessId })
			.from(savedVendors)
			.where(
				and(
					eq(savedVendors.weddingId, wedding.id),
					isNull(savedVendors.deletedAt),
				),
			)
			.orderBy(desc(savedVendors.savedAt), desc(savedVendors.id)),
		db
			.select({
				vendorBusinessId: bookings.vendorBusinessId,
				status: bookings.status,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.weddingId, wedding.id),
					ne(bookings.status, "cancelled"),
					isNull(bookings.deletedAt),
				),
			),
		db
			.select({
				id: categories.id,
				uuid: categories.uuid,
				name: categories.name,
				slug: categories.slug,
			})
			.from(categories)
			.where(eq(categories.isActive, true))
			.orderBy(asc(categories.name)),
	]);

	const savedSet = new Set(savedRows.map((row) => row.vendorBusinessId));
	const bookingByBusiness = new Map<number, BookingStatus>();
	for (const row of bookedRows) {
		bookingByBusiness.set(row.vendorBusinessId, row.status);
	}

	// Ordered union: shortlisted first (most-recently saved), then booking-only.
	const orderedIds: number[] = [];
	const seen = new Set<number>();
	for (const row of [...savedRows, ...bookedRows]) {
		if (seen.has(row.vendorBusinessId)) continue;
		seen.add(row.vendorBusinessId);
		orderedIds.push(row.vendorBusinessId);
	}

	if (orderedIds.length === 0) {
		return {
			members: [],
			missingCategories: activeCategories.map((c) => ({
				uuid: c.uuid,
				name: c.name,
				slug: c.slug,
			})),
		};
	}

	const businessRows = await db.query.vendorBusinesses.findMany({
		where: (vb, { inArray: inArr, isNull: isNil, and: all }) =>
			all(inArr(vb.id, orderedIds), isNil(vb.deletedAt)),
		columns: {
			id: true,
			uuid: true,
			businessName: true,
			city: true,
			region: true,
			isVerified: true,
			logoFileId: true,
		},
	});
	const businessById = new Map(businessRows.map((row) => [row.id, row]));
	const presentIds = businessRows.map((row) => row.id);

	const [primaryRows, coverageRows, logoUrlByFileId] = await Promise.all([
		db
			.select({
				businessId: vendorServices.vendorBusinessId,
				categoryName: categories.name,
			})
			.from(vendorServices)
			.innerJoin(categories, eq(categories.id, vendorServices.categoryId))
			.where(
				and(
					inArray(vendorServices.vendorBusinessId, presentIds),
					eq(vendorServices.isPrimary, true),
					isNull(vendorServices.deletedAt),
				),
			),
		db
			.selectDistinct({ categoryId: vendorServices.categoryId })
			.from(vendorServices)
			.where(
				and(
					inArray(vendorServices.vendorBusinessId, presentIds),
					isNull(vendorServices.deletedAt),
				),
			),
		presignLogosByFileId(businessRows.map((row) => row.logoFileId)),
	]);

	const primaryByBusiness = new Map(
		primaryRows.map((row) => [row.businessId, row.categoryName]),
	);
	const coveredCategoryIds = new Set(
		coverageRows
			.map((row) => row.categoryId)
			.filter((id): id is number => id !== null),
	);

	const members: WeddingTeamMemberSchema[] = [];
	for (const id of orderedIds) {
		const business = businessById.get(id);
		if (!business) continue; // soft-deleted business — drop from the roster
		const bookingStatus = bookingByBusiness.get(id) ?? null;
		members.push({
			vendorBusinessUuid: business.uuid,
			businessName: business.businessName,
			city: business.city,
			region: business.region,
			isVerified: business.isVerified,
			logoUrl:
				business.logoFileId === null
					? null
					: (logoUrlByFileId.get(business.logoFileId) ?? null),
			primaryCategoryName: primaryByBusiness.get(id) ?? null,
			isSaved: savedSet.has(id),
			isBooked: bookingStatus !== null,
			bookingStatus,
		});
	}

	const missingCategories = activeCategories
		.filter((c) => !coveredCategoryIds.has(c.id))
		.map((c) => ({ uuid: c.uuid, name: c.name, slug: c.slug }));

	return { members, missingCategories };
}
