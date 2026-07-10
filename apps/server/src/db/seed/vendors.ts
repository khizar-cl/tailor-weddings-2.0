import type { PriceUnit, SubscriptionTier } from "@repo/shared";
import { and, eq } from "drizzle-orm";
import {
	categories,
	db,
	servicePackages,
	users,
	vendorAccounts,
	vendorBusinesses,
	vendorServices,
} from "..";

export type SeedPackage = {
	name: string;
	description: string;
	priceCents: number;
	priceUnit?: PriceUnit;
};

export type SeedService = {
	/** Resolved to a category id via the seeded categories table. */
	categorySlug: string;
	description: string;
	isPrimary?: boolean;
	// The service's starting price/unit is derived from the cheapest package.
	packages: SeedPackage[];
};

export type SeedVendor = {
	/** Deterministic Clerk id so reruns resolve the same user (idempotency key). */
	clerkId: string;
	email: string;
	name: string;
	subscriptionTier?: SubscriptionTier;
	business: {
		businessName: string;
		tagline: string;
		bio: string;
		website: string;
		city: string;
		region: string;
		yearsInBusiness: number;
		isVerified?: boolean;
	};
	services: SeedService[];
};

/** Cheapest package sets the service's starting price and unit (or null). */
function derivePricing(packages: readonly SeedPackage[]): {
	startingPriceCents: number | null;
	priceUnit: PriceUnit;
} {
	if (packages.length === 0) {
		return { startingPriceCents: null, priceUnit: "flat" };
	}
	const cheapest = packages.reduce((a, b) =>
		b.priceCents < a.priceCents ? b : a,
	);
	return {
		startingPriceCents: cheapest.priceCents,
		priceUnit: cheapest.priceUnit ?? "flat",
	};
}

async function upsertVendorUser(vendor: SeedVendor): Promise<number> {
	await db
		.insert(users)
		.values({
			clerkId: vendor.clerkId,
			email: vendor.email,
			name: vendor.name,
		})
		.onConflictDoNothing({ target: users.clerkId });

	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.clerkId, vendor.clerkId));
	if (!row) throw new Error(`Failed to upsert seed user ${vendor.clerkId}`);
	return row.id;
}

async function upsertVendorAccount(
	userId: number,
	tier: SubscriptionTier,
): Promise<number> {
	await db
		.insert(vendorAccounts)
		.values({ userId, subscriptionTier: tier })
		.onConflictDoNothing({ target: vendorAccounts.userId });

	const [row] = await db
		.select({ id: vendorAccounts.id })
		.from(vendorAccounts)
		.where(eq(vendorAccounts.userId, userId));
	if (!row)
		throw new Error(`Failed to upsert vendor account for user ${userId}`);
	return row.id;
}

async function upsertVendorBusiness(
	vendorAccountId: number,
	business: SeedVendor["business"],
): Promise<number> {
	await db
		.insert(vendorBusinesses)
		.values({
			vendorAccountId,
			businessName: business.businessName,
			tagline: business.tagline,
			bio: business.bio,
			website: business.website,
			city: business.city,
			region: business.region,
			yearsInBusiness: business.yearsInBusiness,
			isVerified: business.isVerified ?? false,
		})
		.onConflictDoNothing({ target: vendorBusinesses.vendorAccountId });

	const [row] = await db
		.select({ id: vendorBusinesses.id })
		.from(vendorBusinesses)
		.where(eq(vendorBusinesses.vendorAccountId, vendorAccountId));
	if (!row) {
		throw new Error(
			`Failed to upsert vendor business for account ${vendorAccountId}`,
		);
	}
	return row.id;
}

async function seedServicePackages(
	vendorServiceId: number,
	packages: readonly SeedPackage[],
) {
	const existing = await db
		.select({ id: servicePackages.id })
		.from(servicePackages)
		.where(eq(servicePackages.vendorServiceId, vendorServiceId));
	if (existing.length > 0 || packages.length === 0) {
		return;
	}

	await db.insert(servicePackages).values(
		packages.map((pkg, index) => ({
			vendorServiceId,
			name: pkg.name,
			description: pkg.description,
			priceCents: pkg.priceCents,
			priceUnit: pkg.priceUnit ?? "flat",
			sortOrder: index * 10,
		})),
	);
}

async function seedVendorService(
	vendorBusinessId: number,
	categoryId: number,
	service: SeedService,
	index: number,
): Promise<number> {
	const { startingPriceCents, priceUnit } = derivePricing(service.packages);
	await db
		.insert(vendorServices)
		.values({
			vendorBusinessId,
			categoryId,
			description: service.description,
			startingPriceCents,
			priceUnit,
			isPrimary: service.isPrimary ?? false,
			isPublished: true,
			sortOrder: index * 10,
		})
		.onConflictDoNothing({
			target: [vendorServices.vendorBusinessId, vendorServices.categoryId],
		});

	const [row] = await db
		.select({ id: vendorServices.id })
		.from(vendorServices)
		.where(
			and(
				eq(vendorServices.vendorBusinessId, vendorBusinessId),
				eq(vendorServices.categoryId, categoryId),
			),
		);
	if (!row) {
		throw new Error(
			`Failed to upsert vendor service ${service.categorySlug} for business ${vendorBusinessId}`,
		);
	}
	return row.id;
}

/** Idempotent — safe to run repeatedly. Requires seedCategories to have run. */
export async function seedVendors(vendors: readonly SeedVendor[]) {
	const categoryRows = await db
		.select({ id: categories.id, slug: categories.slug })
		.from(categories);
	const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

	for (const vendor of vendors) {
		const userId = await upsertVendorUser(vendor);
		const accountId = await upsertVendorAccount(
			userId,
			vendor.subscriptionTier ?? "free",
		);
		const businessId = await upsertVendorBusiness(accountId, vendor.business);

		for (const [index, service] of vendor.services.entries()) {
			const categoryId = categoryIdBySlug.get(service.categorySlug);
			if (!categoryId) {
				throw new Error(
					`Unknown category slug "${service.categorySlug}" — run seedCategories first`,
				);
			}
			const serviceId = await seedVendorService(
				businessId,
				categoryId,
				service,
				index,
			);
			await seedServicePackages(serviceId, service.packages);
		}
	}
}
