import { ORPCError } from "@orpc/server";
import {
	type CoupleOnboardingInput,
	TIER_LIMITS,
	type VendorOnboardingInput,
} from "@repo/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
	categories,
	db,
	portfolioMedia,
	servicePackages,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
	weddings,
} from "../../db";
import {
	getMe,
	markOnboardingComplete,
	provisionCapability,
} from "../user/user.service";

export async function submitCoupleOnboarding(
	dbUserId: number,
	input: CoupleOnboardingInput,
) {
	// Defensive: normally provisioned at sign-up, but guarantee the row exists
	// so a provisioning gap can't trap the user on the onboarding screen.
	await provisionCapability(dbUserId, "couple");

	const [updated] = await db
		.update(weddings)
		.set({
			weddingDate: input.weddingDate ?? null,
			estimatedBudgetCents: input.estimatedBudgetCents,
			guestCountEstimate: input.guestCountEstimate,
			city: input.city,
			region: input.region ?? null,
			styleTags: input.styleTags,
			stylePalette: input.stylePalette,
			onboardingAnswers: {
				weddingDate: input.weddingDate?.toISOString() ?? null,
				estimatedBudgetCents: input.estimatedBudgetCents,
				guestCountEstimate: input.guestCountEstimate,
				city: input.city,
				region: input.region ?? null,
				styleTags: input.styleTags,
				stylePalette: input.stylePalette,
			},
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(weddings.ownerUserId, dbUserId))
		.returning({ id: weddings.id });

	if (!updated) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}

	await markOnboardingComplete(dbUserId, "couple");
	return getMe(dbUserId);
}

export async function submitVendorOnboarding(
	dbUserId: number,
	input: VendorOnboardingInput,
) {
	await provisionCapability(dbUserId, "vendor");

	const account = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.userId, dbUserId),
		columns: { id: true, subscriptionTier: true },
	});
	if (!account) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor account not found" });
	}

	// Resolve the selected categories (deduped, order preserved) to ids,
	// ensuring each is a real, active category.
	const uniqueUuids = [...new Set(input.categoryUuids)];
	const rows = await db.query.categories.findMany({
		where: inArray(categories.uuid, uniqueUuids),
		columns: { id: true, uuid: true, isActive: true },
	});
	const byUuid = new Map(rows.map((r) => [r.uuid, r]));
	const selectedCategoryIds: number[] = [];
	for (const uuid of uniqueUuids) {
		const row = byUuid.get(uuid);
		if (!row?.isActive) {
			throw new ORPCError("NOT_FOUND", { message: "Category not found" });
		}
		selectedCategoryIds.push(row.id);
	}

	const maxServices = TIER_LIMITS[account.subscriptionTier].maxServices;
	if (selectedCategoryIds.length > maxServices) {
		throw new ORPCError("FORBIDDEN", {
			message: `Your plan allows up to ${maxServices} service${maxServices === 1 ? "" : "s"}. Upgrade to add more.`,
		});
	}

	// The first selected category is the business's primary service.
	const primaryCategoryId = selectedCategoryIds[0];

	await db.transaction(async (tx) => {
		// One business per account — update in place or create.
		const existingBusiness = await tx.query.vendorBusinesses.findFirst({
			where: eq(vendorBusinesses.vendorAccountId, account.id),
			columns: { id: true },
		});

		let businessId: number;
		if (existingBusiness) {
			businessId = existingBusiness.id;
			await tx
				.update(vendorBusinesses)
				.set({
					businessName: input.businessName,
					tagline: input.tagline ?? null,
					city: input.city ?? null,
					region: input.region,
					updatedBy: dbUserId,
					updatedAt: new Date(),
				})
				.where(eq(vendorBusinesses.id, businessId));
		} else {
			const [created] = await tx
				.insert(vendorBusinesses)
				.values({
					vendorAccountId: account.id,
					businessName: input.businessName,
					tagline: input.tagline ?? null,
					city: input.city ?? null,
					region: input.region,
					createdBy: dbUserId,
					updatedBy: dbUserId,
				})
				.returning({ id: vendorBusinesses.id });
			if (!created) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create vendor business",
				});
			}
			businessId = created.id;
		}

		// Sync the category services. Load soft-deleted rows too so a re-added
		// category revives its row rather than colliding with the
		// (business, category) unique constraint.
		const existing = await tx.query.vendorServices.findMany({
			where: eq(vendorServices.vendorBusinessId, businessId),
			columns: { id: true, categoryId: true, deletedAt: true },
		});
		const existingByCategory = new Map<number, (typeof existing)[number]>();
		for (const service of existing) {
			if (service.categoryId !== null) {
				existingByCategory.set(service.categoryId, service);
			}
		}
		const selected = new Set(selectedCategoryIds);

		for (const categoryId of selectedCategoryIds) {
			const isPrimary = categoryId === primaryCategoryId;
			const current = existingByCategory.get(categoryId);
			if (current) {
				await tx
					.update(vendorServices)
					.set({
						deletedAt: null,
						isPrimary,
						updatedBy: dbUserId,
						updatedAt: new Date(),
					})
					.where(eq(vendorServices.id, current.id));
			} else {
				await tx.insert(vendorServices).values({
					vendorBusinessId: businessId,
					categoryId,
					isPrimary,
					isPublished: false,
					createdBy: dbUserId,
					updatedBy: dbUserId,
				});
			}
		}

		// Soft-delete de-selected, still-live category services and cascade to
		// their packages and portfolio. Custom-label services (no categoryId) are
		// managed in the profile editor, not here, so they are left untouched.
		const removeIds = existing
			.filter(
				(s) =>
					s.categoryId !== null &&
					s.deletedAt === null &&
					!selected.has(s.categoryId),
			)
			.map((s) => s.id);
		if (removeIds.length > 0) {
			const now = new Date();
			await tx
				.update(servicePackages)
				.set({ deletedAt: now, updatedBy: dbUserId, updatedAt: now })
				.where(
					and(
						inArray(servicePackages.vendorServiceId, removeIds),
						isNull(servicePackages.deletedAt),
					),
				);
			await tx
				.update(portfolioMedia)
				.set({ deletedAt: now, updatedBy: dbUserId, updatedAt: now })
				.where(
					and(
						inArray(portfolioMedia.vendorServiceId, removeIds),
						isNull(portfolioMedia.deletedAt),
					),
				);
			await tx
				.update(vendorServices)
				.set({ deletedAt: now, updatedBy: dbUserId, updatedAt: now })
				.where(inArray(vendorServices.id, removeIds));
		}
	});

	await markOnboardingComplete(dbUserId, "vendor");
	return getMe(dbUserId);
}
