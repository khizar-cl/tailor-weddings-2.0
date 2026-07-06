import { ORPCError } from "@orpc/server";
import type {
	CoupleOnboardingInput,
	VendorOnboardingInput,
} from "@repo/shared";
import { asc, eq } from "drizzle-orm";
import {
	categories,
	db,
	vendorAccounts,
	vendorProfiles,
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
		columns: { id: true },
	});
	if (!account) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor account not found" });
	}

	const category = await db.query.categories.findFirst({
		where: eq(categories.uuid, input.categoryUuid),
		columns: { id: true, isActive: true },
	});
	if (!category?.isActive) {
		throw new ORPCError("NOT_FOUND", { message: "Category not found" });
	}

	// Re-running onboarding updates the first draft profile rather than stacking
	// duplicates; full multi-profile management arrives with vendor CRUD.
	const existingProfile = await db.query.vendorProfiles.findFirst({
		where: eq(vendorProfiles.vendorAccountId, account.id),
		columns: { id: true },
		orderBy: [asc(vendorProfiles.id)],
	});

	if (existingProfile) {
		await db
			.update(vendorProfiles)
			.set({
				categoryId: category.id,
				businessName: input.businessName,
				tagline: input.tagline ?? null,
				city: input.city ?? null,
				region: input.region,
				updatedBy: dbUserId,
				updatedAt: new Date(),
			})
			.where(eq(vendorProfiles.id, existingProfile.id));
	} else {
		await db.insert(vendorProfiles).values({
			vendorAccountId: account.id,
			categoryId: category.id,
			businessName: input.businessName,
			tagline: input.tagline ?? null,
			city: input.city ?? null,
			region: input.region,
			isPublished: false,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		});
	}

	await markOnboardingComplete(dbUserId, "vendor");
	return getMe(dbUserId);
}
