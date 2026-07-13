import { ORPCError } from "@orpc/server";
import {
	DISCOVERY_PAGE_SIZE,
	type VendorDetailSchema,
	type VendorSearchInputSchema,
	type VendorSearchResultSchema,
} from "@repo/shared";
import {
	and,
	asc,
	avg,
	count,
	countDistinct,
	desc,
	eq,
	ilike,
	inArray,
	isNotNull,
	isNull,
	sql,
} from "drizzle-orm";
import {
	categories,
	db,
	reviews,
	savedVendors,
	vendorBusinesses,
	vendorServices,
} from "../../db";
import { getCoupleWeddingIdOrNull } from "../wedding/wedding-access";
import { presignImage, presignLogosByFileId } from "./vendor.helpers";

/** Mean rating rounded to one decimal, or null when there are no reviews. */
function toAverage(raw: string | null): number | null {
	return raw === null ? null : Math.round(Number(raw) * 10) / 10;
}

export async function searchVendors(
	dbUserId: number,
	input: VendorSearchInputSchema,
): Promise<VendorSearchResultSchema> {
	const page = input.page;
	const pageSize = DISCOVERY_PAGE_SIZE;

	// Only businesses with at least one published taxonomy service are listed;
	// custom-label services (categoryId null) never surface in discovery.
	const filters = and(
		isNull(vendorBusinesses.deletedAt),
		isNull(vendorServices.deletedAt),
		eq(vendorServices.isPublished, true),
		isNotNull(vendorServices.categoryId),
		input.region
			? ilike(vendorBusinesses.region, `%${input.region}%`)
			: undefined,
		input.query
			? ilike(vendorBusinesses.businessName, `%${input.query}%`)
			: undefined,
		input.categoryUuid ? eq(categories.uuid, input.categoryUuid) : undefined,
	);

	const [totalRow] = await db
		.select({ value: countDistinct(vendorBusinesses.id) })
		.from(vendorBusinesses)
		.innerJoin(
			vendorServices,
			eq(vendorServices.vendorBusinessId, vendorBusinesses.id),
		)
		.leftJoin(categories, eq(categories.id, vendorServices.categoryId))
		.where(filters);
	const total = totalRow?.value ?? 0;

	const pageRows = await db
		.select({
			id: vendorBusinesses.id,
			uuid: vendorBusinesses.uuid,
			businessName: vendorBusinesses.businessName,
			tagline: vendorBusinesses.tagline,
			city: vendorBusinesses.city,
			region: vendorBusinesses.region,
			isVerified: vendorBusinesses.isVerified,
			logoFileId: vendorBusinesses.logoFileId,
			fromPriceCents: sql<
				number | null
			>`min(${vendorServices.startingPriceCents})`,
		})
		.from(vendorBusinesses)
		.innerJoin(
			vendorServices,
			eq(vendorServices.vendorBusinessId, vendorBusinesses.id),
		)
		.leftJoin(categories, eq(categories.id, vendorServices.categoryId))
		.where(filters)
		.groupBy(vendorBusinesses.id)
		.orderBy(
			desc(vendorBusinesses.isVerified),
			asc(vendorBusinesses.businessName),
			asc(vendorBusinesses.id),
		)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	if (pageRows.length === 0) {
		return { items: [], page, pageSize, total, hasMore: false };
	}

	const businessIds = pageRows.map((row) => row.id);
	const weddingId = await getCoupleWeddingIdOrNull(dbUserId);

	const [serviceRows, ratingRows, savedRows, logoUrlByFileId] =
		await Promise.all([
			db
				.select({
					businessId: vendorServices.vendorBusinessId,
					categoryName: categories.name,
					categoryUuid: categories.uuid,
				})
				.from(vendorServices)
				.innerJoin(categories, eq(categories.id, vendorServices.categoryId))
				.where(
					and(
						inArray(vendorServices.vendorBusinessId, businessIds),
						eq(vendorServices.isPublished, true),
						isNull(vendorServices.deletedAt),
					),
				)
				.orderBy(
					desc(vendorServices.isPrimary),
					asc(vendorServices.sortOrder),
					asc(vendorServices.id),
				),
			db
				.select({
					businessId: reviews.subjectVendorBusinessId,
					average: avg(reviews.overallRating),
					count: count(),
				})
				.from(reviews)
				.where(
					and(
						inArray(reviews.subjectVendorBusinessId, businessIds),
						eq(reviews.status, "published"),
					),
				)
				.groupBy(reviews.subjectVendorBusinessId),
			weddingId === null
				? Promise.resolve([])
				: db
						.select({ vendorBusinessId: savedVendors.vendorBusinessId })
						.from(savedVendors)
						.where(
							and(
								eq(savedVendors.weddingId, weddingId),
								inArray(savedVendors.vendorBusinessId, businessIds),
								isNull(savedVendors.deletedAt),
							),
						),
			presignLogosByFileId(pageRows.map((row) => row.logoFileId)),
		]);

	// serviceRows are ordered primary-first; keep the first match per business —
	// the searched category when filtering, else the primary/first service.
	const featuredByBusiness = new Map<
		number,
		{ categoryName: string; categoryUuid: string }
	>();
	for (const row of serviceRows) {
		if (input.categoryUuid && row.categoryUuid !== input.categoryUuid) continue;
		if (!featuredByBusiness.has(row.businessId)) {
			featuredByBusiness.set(row.businessId, {
				categoryName: row.categoryName,
				categoryUuid: row.categoryUuid,
			});
		}
	}

	const ratingByBusiness = new Map(
		ratingRows.map((row) => [
			row.businessId,
			{ average: toAverage(row.average), count: row.count },
		]),
	);
	const savedSet = new Set(savedRows.map((row) => row.vendorBusinessId));

	const items = pageRows.map((row) => ({
		uuid: row.uuid,
		businessName: row.businessName,
		tagline: row.tagline,
		city: row.city,
		region: row.region,
		isVerified: row.isVerified,
		logoUrl:
			row.logoFileId === null
				? null
				: (logoUrlByFileId.get(row.logoFileId) ?? null),
		featuredService: featuredByBusiness.get(row.id) ?? null,
		fromPriceCents: row.fromPriceCents,
		rating: ratingByBusiness.get(row.id) ?? { average: null, count: 0 },
		isSaved: savedSet.has(row.id),
	}));

	return {
		items,
		page,
		pageSize,
		total,
		hasMore: page * pageSize < total,
	};
}

export async function getVendorByUuid(
	dbUserId: number,
	uuid: string,
): Promise<VendorDetailSchema> {
	const business = await db.query.vendorBusinesses.findFirst({
		where: and(
			eq(vendorBusinesses.uuid, uuid),
			isNull(vendorBusinesses.deletedAt),
		),
		columns: {
			id: true,
			uuid: true,
			businessName: true,
			tagline: true,
			bio: true,
			city: true,
			region: true,
			website: true,
			yearsInBusiness: true,
			isVerified: true,
		},
		with: {
			logo: { columns: { key: true, fileName: true } },
			services: {
				where: (svc, { and, eq, isNull, isNotNull }) =>
					and(
						eq(svc.isPublished, true),
						isNull(svc.deletedAt),
						isNotNull(svc.categoryId),
					),
				orderBy: (svc, { asc, desc }) => [
					desc(svc.isPrimary),
					asc(svc.sortOrder),
					asc(svc.id),
				],
				columns: {
					uuid: true,
					description: true,
					startingPriceCents: true,
					priceUnit: true,
					isPrimary: true,
				},
				with: {
					category: { columns: { name: true, uuid: true } },
					packages: {
						where: (pkg, { and, eq, isNull }) =>
							and(eq(pkg.isActive, true), isNull(pkg.deletedAt)),
						orderBy: (pkg, { asc }) => [asc(pkg.sortOrder), asc(pkg.id)],
						columns: {
							uuid: true,
							name: true,
							description: true,
							priceCents: true,
							priceUnit: true,
						},
					},
					portfolio: {
						where: (media, { isNull }) => isNull(media.deletedAt),
						orderBy: (media, { asc }) => [asc(media.sortOrder), asc(media.id)],
						columns: { uuid: true, caption: true },
						with: { file: { columns: { key: true, fileName: true } } },
					},
				},
			},
		},
	});

	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
	}

	const weddingId = await getCoupleWeddingIdOrNull(dbUserId);
	const [ratingRow, peerRow, savedRow, logoUrl] = await Promise.all([
		db
			.select({ average: avg(reviews.overallRating), count: count() })
			.from(reviews)
			.where(
				and(
					eq(reviews.subjectVendorBusinessId, business.id),
					eq(reviews.status, "published"),
				),
			)
			.then((rows) => rows[0]),
		db
			.select({ count: count() })
			.from(reviews)
			.where(
				and(
					eq(reviews.subjectVendorBusinessId, business.id),
					eq(reviews.status, "published"),
					eq(reviews.type, "peer"),
				),
			)
			.then((rows) => rows[0]),
		weddingId === null
			? Promise.resolve(undefined)
			: db.query.savedVendors.findFirst({
					where: and(
						eq(savedVendors.weddingId, weddingId),
						eq(savedVendors.vendorBusinessId, business.id),
						isNull(savedVendors.deletedAt),
					),
					columns: { id: true },
				}),
		presignImage(business.logo),
	]);

	type ServiceRow = (typeof business.services)[number];
	const publishedServices = business.services.filter(
		(
			svc,
		): svc is ServiceRow & { category: NonNullable<ServiceRow["category"]> } =>
			svc.category !== null,
	);

	const services = await Promise.all(
		publishedServices.map(async (svc) => ({
			uuid: svc.uuid,
			categoryName: svc.category.name,
			categoryUuid: svc.category.uuid,
			description: svc.description,
			startingPriceCents: svc.startingPriceCents,
			priceUnit: svc.priceUnit,
			isPrimary: svc.isPrimary,
			packages: svc.packages.map((pkg) => ({
				uuid: pkg.uuid,
				name: pkg.name,
				description: pkg.description,
				priceCents: pkg.priceCents,
				priceUnit: pkg.priceUnit,
			})),
			portfolio: await Promise.all(
				svc.portfolio.map(async (media) => ({
					uuid: media.uuid,
					caption: media.caption,
					url: await presignImage(media.file),
				})),
			),
		})),
	);

	return {
		uuid: business.uuid,
		businessName: business.businessName,
		tagline: business.tagline,
		bio: business.bio,
		city: business.city,
		region: business.region,
		website: business.website,
		yearsInBusiness: business.yearsInBusiness,
		isVerified: business.isVerified,
		logoUrl,
		services,
		rating: {
			average: toAverage(ratingRow?.average ?? null),
			count: ratingRow?.count ?? 0,
		},
		peerEndorsementCount: peerRow?.count ?? 0,
		isSaved: savedRow !== undefined,
	};
}
