import { ORPCError } from "@orpc/server";
import {
	type AddVendorPackageInputSchema,
	type AddVendorServiceInputSchema,
	type ReorderPortfolioInputSchema,
	type SetServicePublishInputSchema,
	type SubscriptionTier,
	TIER_LIMITS,
	type UpdateVendorBusinessInputSchema,
	type UpdateVendorPackageInputSchema,
	type UpdateVendorServiceInputSchema,
	type UploadLogoInput,
	type UploadPortfolioInput,
	type VendorProfileSchema,
} from "@repo/shared";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import {
	db,
	portfolioMedia,
	servicePackages,
	vendorBusinesses,
	vendorServices,
} from "../../db";
import { resolveActiveCategoryId } from "../category/category.service";
import { type DbUser, handleFileUpload } from "../storage/storage.service";
import {
	getOwnedBusiness,
	maxServicesMessage,
	presignImage,
} from "./vendor.helpers";

/** Trim an optional text field, treating blank as "cleared" (null). */
function optionalText(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

async function nextSortOrder(
	column:
		| typeof vendorServices.sortOrder
		| typeof servicePackages.sortOrder
		| typeof portfolioMedia.sortOrder,
	table: typeof vendorServices | typeof servicePackages | typeof portfolioMedia,
	scope: ReturnType<typeof and>,
) {
	const [row] = await db
		.select({ value: column })
		.from(table)
		.where(scope)
		.orderBy(desc(column))
		.limit(1);
	return (row?.value ?? -1) + 1;
}

async function buildProfile(
	businessId: number,
	tier: SubscriptionTier,
): Promise<VendorProfileSchema> {
	const business = await db.query.vendorBusinesses.findFirst({
		where: eq(vendorBusinesses.id, businessId),
		columns: {
			uuid: true,
			businessName: true,
			tagline: true,
			bio: true,
			website: true,
			city: true,
			region: true,
			yearsInBusiness: true,
			isVerified: true,
		},
		with: {
			logo: { columns: { key: true, fileName: true } },
			services: {
				where: (svc, { isNull }) => isNull(svc.deletedAt),
				orderBy: (svc, { asc, desc }) => [
					desc(svc.isPrimary),
					asc(svc.sortOrder),
					asc(svc.id),
				],
				columns: {
					uuid: true,
					customLabel: true,
					description: true,
					startingPriceCents: true,
					priceUnit: true,
					isPrimary: true,
					isPublished: true,
				},
				with: {
					category: { columns: { uuid: true, name: true } },
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
						columns: { uuid: true, caption: true, sortOrder: true },
						with: { file: { columns: { key: true, fileName: true } } },
					},
				},
			},
		},
	});

	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor business not found" });
	}

	const services = await Promise.all(
		business.services.map(async (svc) => ({
			uuid: svc.uuid,
			categoryUuid: svc.category?.uuid ?? null,
			categoryName: svc.category?.name ?? null,
			customLabel: svc.customLabel,
			displayName: svc.category?.name ?? svc.customLabel ?? "Service",
			description: svc.description,
			startingPriceCents: svc.startingPriceCents,
			priceUnit: svc.priceUnit,
			isPrimary: svc.isPrimary,
			isPublished: svc.isPublished,
			isPending: svc.category === null,
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
					url: await presignImage(media.file),
					caption: media.caption,
					sortOrder: media.sortOrder,
				})),
			),
		})),
	);

	const limits = TIER_LIMITS[tier];
	return {
		uuid: business.uuid,
		businessName: business.businessName,
		tagline: business.tagline,
		bio: business.bio,
		website: business.website,
		city: business.city,
		region: business.region,
		yearsInBusiness: business.yearsInBusiness,
		logoUrl: await presignImage(business.logo),
		isVerified: business.isVerified,
		tier,
		limits: {
			maxServices: limits.maxServices,
			maxPortfolioImagesPerService: limits.maxPortfolioImagesPerService,
		},
		services,
	};
}

/** Re-read a service owned by the caller's business, or throw. */
async function resolveOwnedService(businessId: number, serviceUuid: string) {
	const service = await db.query.vendorServices.findFirst({
		where: and(
			eq(vendorServices.uuid, serviceUuid),
			eq(vendorServices.vendorBusinessId, businessId),
			isNull(vendorServices.deletedAt),
		),
		columns: { id: true, categoryId: true, isPrimary: true },
	});
	if (!service) {
		throw new ORPCError("NOT_FOUND", { message: "Service not found" });
	}
	return service;
}

async function resolveOwnedPackage(businessId: number, packageUuid: string) {
	const pkg = await db.query.servicePackages.findFirst({
		where: and(
			eq(servicePackages.uuid, packageUuid),
			isNull(servicePackages.deletedAt),
		),
		columns: { id: true, vendorServiceId: true },
		with: {
			vendorService: { columns: { vendorBusinessId: true, deletedAt: true } },
		},
	});
	if (
		!pkg ||
		pkg.vendorService.vendorBusinessId !== businessId ||
		pkg.vendorService.deletedAt !== null
	) {
		throw new ORPCError("NOT_FOUND", { message: "Package not found" });
	}
	return { id: pkg.id, vendorServiceId: pkg.vendorServiceId };
}

/**
 * A service's starting price is the cheapest of its active packages (with that
 * package's unit), recomputed whenever packages change. Null when it has none.
 */
async function recomputeServicePricing(serviceId: number, dbUserId: number) {
	const cheapest = await db.query.servicePackages.findFirst({
		where: and(
			eq(servicePackages.vendorServiceId, serviceId),
			eq(servicePackages.isActive, true),
			isNull(servicePackages.deletedAt),
		),
		orderBy: [asc(servicePackages.priceCents), asc(servicePackages.id)],
		columns: { priceCents: true, priceUnit: true },
	});
	await db
		.update(vendorServices)
		.set({
			startingPriceCents: cheapest?.priceCents ?? null,
			priceUnit: cheapest?.priceUnit ?? "flat",
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(vendorServices.id, serviceId));
}

/** Whether a service has at least one active, non-deleted package. */
async function serviceHasActivePackage(serviceId: number) {
	const pkg = await db.query.servicePackages.findFirst({
		where: and(
			eq(servicePackages.vendorServiceId, serviceId),
			eq(servicePackages.isActive, true),
			isNull(servicePackages.deletedAt),
		),
		columns: { id: true },
	});
	return pkg !== undefined;
}

async function resolveOwnedPortfolio(
	businessId: number,
	portfolioUuid: string,
) {
	const media = await db.query.portfolioMedia.findFirst({
		where: and(
			eq(portfolioMedia.uuid, portfolioUuid),
			isNull(portfolioMedia.deletedAt),
		),
		columns: { id: true },
		with: {
			vendorService: { columns: { vendorBusinessId: true, deletedAt: true } },
		},
	});
	if (
		!media ||
		media.vendorService.vendorBusinessId !== businessId ||
		media.vendorService.deletedAt !== null
	) {
		throw new ORPCError("NOT_FOUND", { message: "Image not found" });
	}
	return { id: media.id };
}

export async function getVendorProfile(dbUserId: number) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	return buildProfile(businessId, tier);
}

export async function updateVendorBusiness(
	dbUserId: number,
	input: UpdateVendorBusinessInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	await db
		.update(vendorBusinesses)
		.set({
			businessName: input.businessName,
			region: input.region,
			tagline: optionalText(input.tagline),
			bio: optionalText(input.bio),
			website: optionalText(input.website),
			city: optionalText(input.city),
			yearsInBusiness: input.yearsInBusiness ?? null,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(vendorBusinesses.id, businessId));
	return buildProfile(businessId, tier);
}

export async function uploadVendorLogo(
	dbUser: DbUser,
	file: UploadLogoInput["file"],
) {
	const { businessId, tier } = await getOwnedBusiness(dbUser.id);
	const uploaded = await handleFileUpload(dbUser, file);
	const record = await db.query.files.findFirst({
		where: (files, { eq }) => eq(files.uuid, uploaded.uuid),
		columns: { id: true },
	});
	if (!record) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to save logo",
		});
	}
	await db
		.update(vendorBusinesses)
		.set({ logoFileId: record.id, updatedBy: dbUser.id, updatedAt: new Date() })
		.where(eq(vendorBusinesses.id, businessId));
	return buildProfile(businessId, tier);
}

export async function addVendorService(
	dbUserId: number,
	input: AddVendorServiceInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);

	const [live] = await db
		.select({ value: count() })
		.from(vendorServices)
		.where(
			and(
				eq(vendorServices.vendorBusinessId, businessId),
				isNull(vendorServices.deletedAt),
			),
		);
	const liveCount = live?.value ?? 0;
	const maxServices = TIER_LIMITS[tier].maxServices;
	if (liveCount >= maxServices) {
		throw new ORPCError("FORBIDDEN", {
			message: maxServicesMessage(maxServices),
		});
	}

	const isPrimary = liveCount === 0;
	const sortOrder = await nextSortOrder(
		vendorServices.sortOrder,
		vendorServices,
		eq(vendorServices.vendorBusinessId, businessId),
	);
	// startingPriceCents / priceUnit are derived from packages (see
	// recomputeServicePricing), never entered directly.
	const baseValues = {
		description: input.description,
		isPrimary,
		isPublished: false,
		updatedBy: dbUserId,
	};

	if (input.categoryUuid) {
		const categoryId = await resolveActiveCategoryId(input.categoryUuid);

		// (business, category) is unique; revive a soft-deleted row rather than
		// colliding with the constraint.
		const existing = await db.query.vendorServices.findFirst({
			where: and(
				eq(vendorServices.vendorBusinessId, businessId),
				eq(vendorServices.categoryId, categoryId),
			),
			columns: { id: true, deletedAt: true },
		});
		if (existing && existing.deletedAt === null) {
			throw new ORPCError("CONFLICT", {
				message: "You already offer this service.",
			});
		}
		if (existing) {
			await db
				.update(vendorServices)
				.set({ ...baseValues, deletedAt: null, updatedAt: new Date() })
				.where(eq(vendorServices.id, existing.id));
		} else {
			await db.insert(vendorServices).values({
				vendorBusinessId: businessId,
				categoryId,
				sortOrder,
				createdBy: dbUserId,
				...baseValues,
			});
		}
	} else {
		await db.insert(vendorServices).values({
			vendorBusinessId: businessId,
			customLabel: input.customLabel,
			sortOrder,
			createdBy: dbUserId,
			...baseValues,
		});
	}

	return buildProfile(businessId, tier);
}

export async function updateVendorService(
	dbUserId: number,
	input: UpdateVendorServiceInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const service = await resolveOwnedService(businessId, input.serviceUuid);

	const set: Record<string, unknown> = {
		description: input.description,
		updatedBy: dbUserId,
		updatedAt: new Date(),
	};
	// Only custom services carry an editable label; taxonomy services are named
	// by their category.
	if (input.customLabel !== undefined && service.categoryId === null) {
		set.customLabel = input.customLabel;
	}

	await db
		.update(vendorServices)
		.set(set)
		.where(eq(vendorServices.id, service.id));
	return buildProfile(businessId, tier);
}

export async function removeVendorService(
	dbUserId: number,
	serviceUuid: string,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const service = await resolveOwnedService(businessId, serviceUuid);
	const now = new Date();

	await db.transaction(async (tx) => {
		await tx
			.update(servicePackages)
			.set({ deletedAt: now, updatedBy: dbUserId, updatedAt: now })
			.where(
				and(
					eq(servicePackages.vendorServiceId, service.id),
					isNull(servicePackages.deletedAt),
				),
			);
		await tx
			.update(portfolioMedia)
			.set({ deletedAt: now, updatedBy: dbUserId, updatedAt: now })
			.where(
				and(
					eq(portfolioMedia.vendorServiceId, service.id),
					isNull(portfolioMedia.deletedAt),
				),
			);
		await tx
			.update(vendorServices)
			.set({
				deletedAt: now,
				isPrimary: false,
				updatedBy: dbUserId,
				updatedAt: now,
			})
			.where(eq(vendorServices.id, service.id));

		// Keep a primary designated: promote the next remaining service.
		if (service.isPrimary) {
			const next = await tx.query.vendorServices.findFirst({
				where: and(
					eq(vendorServices.vendorBusinessId, businessId),
					isNull(vendorServices.deletedAt),
				),
				orderBy: [asc(vendorServices.sortOrder), asc(vendorServices.id)],
				columns: { id: true },
			});
			if (next) {
				await tx
					.update(vendorServices)
					.set({ isPrimary: true, updatedBy: dbUserId, updatedAt: now })
					.where(eq(vendorServices.id, next.id));
			}
		}
	});

	return buildProfile(businessId, tier);
}

export async function setServicePrimary(dbUserId: number, serviceUuid: string) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const service = await resolveOwnedService(businessId, serviceUuid);
	const now = new Date();

	await db.transaction(async (tx) => {
		await tx
			.update(vendorServices)
			.set({ isPrimary: false, updatedBy: dbUserId, updatedAt: now })
			.where(
				and(
					eq(vendorServices.vendorBusinessId, businessId),
					isNull(vendorServices.deletedAt),
				),
			);
		await tx
			.update(vendorServices)
			.set({ isPrimary: true, updatedBy: dbUserId, updatedAt: now })
			.where(eq(vendorServices.id, service.id));
	});

	return buildProfile(businessId, tier);
}

export async function setServicePublish(
	dbUserId: number,
	input: SetServicePublishInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const service = await resolveOwnedService(businessId, input.serviceUuid);

	// Custom services aren't discoverable until an admin promotes them, so they
	// can't be published.
	if (input.isPublished && service.categoryId === null) {
		throw new ORPCError("FORBIDDEN", {
			message:
				"Custom services can't be published until they're approved into a category.",
		});
	}

	// A published listing must carry a logo — it's the couple's first impression.
	if (input.isPublished) {
		const business = await db.query.vendorBusinesses.findFirst({
			where: eq(vendorBusinesses.id, businessId),
			columns: { logoFileId: true },
		});
		if (!business?.logoFileId) {
			throw new ORPCError("FORBIDDEN", {
				message: "Add a business logo before publishing your services.",
			});
		}
	}

	// A published listing must be bookable — couples book a package, so there
	// has to be at least one to publish.
	if (input.isPublished && !(await serviceHasActivePackage(service.id))) {
		throw new ORPCError("FORBIDDEN", {
			message: "Add a package before publishing this service.",
		});
	}

	await db
		.update(vendorServices)
		.set({
			isPublished: input.isPublished,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(vendorServices.id, service.id));
	return buildProfile(businessId, tier);
}

export async function addVendorPackage(
	dbUserId: number,
	input: AddVendorPackageInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const service = await resolveOwnedService(businessId, input.serviceUuid);
	const sortOrder = await nextSortOrder(
		servicePackages.sortOrder,
		servicePackages,
		eq(servicePackages.vendorServiceId, service.id),
	);
	await db.insert(servicePackages).values({
		vendorServiceId: service.id,
		name: input.name,
		description: optionalText(input.description),
		priceCents: input.priceCents,
		priceUnit: input.priceUnit,
		sortOrder,
		createdBy: dbUserId,
		updatedBy: dbUserId,
	});
	await recomputeServicePricing(service.id, dbUserId);
	return buildProfile(businessId, tier);
}

export async function updateVendorPackage(
	dbUserId: number,
	input: UpdateVendorPackageInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const pkg = await resolveOwnedPackage(businessId, input.packageUuid);
	await db
		.update(servicePackages)
		.set({
			name: input.name,
			description: optionalText(input.description),
			priceCents: input.priceCents,
			priceUnit: input.priceUnit,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(servicePackages.id, pkg.id));
	await recomputeServicePricing(pkg.vendorServiceId, dbUserId);
	return buildProfile(businessId, tier);
}

export async function removeVendorPackage(
	dbUserId: number,
	packageUuid: string,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const pkg = await resolveOwnedPackage(businessId, packageUuid);
	await db
		.update(servicePackages)
		.set({ deletedAt: new Date(), updatedBy: dbUserId, updatedAt: new Date() })
		.where(eq(servicePackages.id, pkg.id));
	await recomputeServicePricing(pkg.vendorServiceId, dbUserId);

	// A service with no packages can't be booked, so it can't stay published.
	if (!(await serviceHasActivePackage(pkg.vendorServiceId))) {
		await db
			.update(vendorServices)
			.set({ isPublished: false, updatedBy: dbUserId, updatedAt: new Date() })
			.where(
				and(
					eq(vendorServices.id, pkg.vendorServiceId),
					eq(vendorServices.isPublished, true),
				),
			);
	}
	return buildProfile(businessId, tier);
}

export async function uploadPortfolioImage(
	dbUser: DbUser,
	input: UploadPortfolioInput,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUser.id);
	const service = await resolveOwnedService(businessId, input.serviceUuid);

	const [live] = await db
		.select({ value: count() })
		.from(portfolioMedia)
		.where(
			and(
				eq(portfolioMedia.vendorServiceId, service.id),
				isNull(portfolioMedia.deletedAt),
			),
		);
	const max = TIER_LIMITS[tier].maxPortfolioImagesPerService;
	if ((live?.value ?? 0) >= max) {
		throw new ORPCError("FORBIDDEN", {
			message: `This service can hold up to ${max} images. Remove one to add another.`,
		});
	}

	const uploaded = await handleFileUpload(dbUser, input.file);
	const file = await db.query.files.findFirst({
		where: (files, { eq }) => eq(files.uuid, uploaded.uuid),
		columns: { id: true },
	});
	if (!file) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to save image",
		});
	}

	const sortOrder = await nextSortOrder(
		portfolioMedia.sortOrder,
		portfolioMedia,
		eq(portfolioMedia.vendorServiceId, service.id),
	);
	await db.insert(portfolioMedia).values({
		vendorServiceId: service.id,
		fileId: file.id,
		caption: optionalText(input.caption),
		sortOrder,
		createdBy: dbUser.id,
		updatedBy: dbUser.id,
	});

	return buildProfile(businessId, tier);
}

export async function removePortfolioImage(
	dbUserId: number,
	portfolioUuid: string,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const media = await resolveOwnedPortfolio(businessId, portfolioUuid);
	await db
		.update(portfolioMedia)
		.set({ deletedAt: new Date(), updatedBy: dbUserId, updatedAt: new Date() })
		.where(eq(portfolioMedia.id, media.id));
	return buildProfile(businessId, tier);
}

export async function reorderPortfolio(
	dbUserId: number,
	input: ReorderPortfolioInputSchema,
) {
	const { businessId, tier } = await getOwnedBusiness(dbUserId);
	const service = await resolveOwnedService(businessId, input.serviceUuid);
	const now = new Date();

	await db.transaction(async (tx) => {
		let order = 0;
		for (const uuid of input.orderedUuids) {
			await tx
				.update(portfolioMedia)
				.set({ sortOrder: order, updatedBy: dbUserId, updatedAt: now })
				.where(
					and(
						eq(portfolioMedia.uuid, uuid),
						eq(portfolioMedia.vendorServiceId, service.id),
						isNull(portfolioMedia.deletedAt),
					),
				);
			order += 1;
		}
	});

	return buildProfile(businessId, tier);
}
