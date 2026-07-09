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

type SeedPackage = {
	name: string;
	description: string;
	priceCents: number;
	priceUnit?: PriceUnit;
};

type SeedService = {
	/** Resolved to a category id via the seeded categories table. */
	categorySlug: string;
	description: string;
	startingPriceCents: number;
	priceUnit?: PriceUnit;
	isPrimary?: boolean;
	packages: SeedPackage[];
};

type SeedVendor = {
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

/**
 * Demo vendors for local development. Each entry owns one vendor account, one
 * business, and one or more published services with packages — enough to
 * exercise discovery, matching, and budget estimates. Clerk ids are synthetic
 * (`seed_vendor_*`) and never collide with real Clerk users.
 */
export const VENDOR_SEED: readonly SeedVendor[] = [
	{
		clerkId: "seed_vendor_golden_hour",
		email: "hello@goldenhourstudios.test",
		name: "Amara Okafor",
		subscriptionTier: "pro",
		business: {
			businessName: "Golden Hour Studios",
			tagline: "Light-chasing photo & film for the unhurried couple",
			bio: "A two-person studio shooting weddings on medium-format film and cinematic digital. We stay for the whole day and hand back a story, not just a gallery.",
			website: "https://goldenhourstudios.test",
			city: "Portland",
			region: "Oregon",
			yearsInBusiness: 9,
			isVerified: true,
		},
		services: [
			{
				categorySlug: "photography",
				description:
					"Full-day documentary photography, two shooters, hand-edited gallery of 600+ images.",
				startingPriceCents: 450_000,
				isPrimary: true,
				packages: [
					{
						name: "Elopement Half-Day",
						description: "Up to 5 hours, single photographer, online gallery.",
						priceCents: 450_000,
					},
					{
						name: "Full Celebration",
						description:
							"10 hours, two photographers, engagement session, heirloom album.",
						priceCents: 780_000,
					},
				],
			},
			{
				categorySlug: "videography",
				description:
					"Cinematic wedding films — a 4-minute highlight reel plus full-ceremony edit.",
				startingPriceCents: 520_000,
				packages: [
					{
						name: "Highlight Film",
						description: "4–5 minute edited highlight reel, licensed music.",
						priceCents: 520_000,
					},
				],
			},
		],
	},
	{
		clerkId: "seed_vendor_ivy_barn",
		email: "events@theivybarn.test",
		name: "Theo Marsh",
		subscriptionTier: "pro",
		business: {
			businessName: "The Ivy Barn",
			tagline: "A restored 1890s barn on forty acres of wildflower meadow",
			bio: "Exposed timber, string lights, and a view of the coast range. Seats 180 indoors with a covered terrace for the ceremony.",
			website: "https://theivybarn.test",
			city: "Hillsboro",
			region: "Oregon",
			yearsInBusiness: 6,
			isVerified: true,
		},
		services: [
			{
				categorySlug: "venue",
				description:
					"Exclusive weekend venue hire including tables, chairs, and on-site coordinator.",
				startingPriceCents: 850_000,
				priceUnit: "flat",
				isPrimary: true,
				packages: [
					{
						name: "Saturday Full Weekend",
						description:
							"Friday rehearsal through Sunday cleanup, up to 180 guests.",
						priceCents: 1_200_000,
					},
					{
						name: "Weekday Micro-Wedding",
						description: "Single-day hire, up to 60 guests.",
						priceCents: 850_000,
					},
				],
			},
		],
	},
	{
		clerkId: "seed_vendor_wild_stem",
		email: "studio@wildstemflorals.test",
		name: "Priya Nair",
		business: {
			businessName: "Wild Stem Florals",
			tagline: "Foraged, seasonal, gloriously untamed arrangements",
			bio: "We grow much of what we arrange on a small plot outside the city, so every installation leans into what the season is actually doing.",
			website: "https://wildstemflorals.test",
			city: "Eugene",
			region: "Oregon",
			yearsInBusiness: 4,
		},
		services: [
			{
				categorySlug: "floral",
				description:
					"Bridal party florals, ceremony installations, and reception centerpieces.",
				startingPriceCents: 280_000,
				isPrimary: true,
				packages: [
					{
						name: "Bridal Essentials",
						description: "Bouquet, boutonnières, and two corsages.",
						priceCents: 65_000,
					},
					{
						name: "Full Floral Design",
						description:
							"Arch installation, aisle markers, and ten centerpieces.",
						priceCents: 420_000,
					},
				],
			},
		],
	},
	{
		clerkId: "seed_vendor_feast_field",
		email: "book@feastandfield.test",
		name: "Marcus Bell",
		subscriptionTier: "pro",
		business: {
			businessName: "Feast & Field",
			tagline: "Farm-to-table wedding catering with zero-waste plating",
			bio: "A seasonal, source-local kitchen. We build menus around what regional farms are harvesting the week of your wedding.",
			website: "https://feastandfield.test",
			city: "Portland",
			region: "Oregon",
			yearsInBusiness: 11,
			isVerified: true,
		},
		services: [
			{
				categorySlug: "catering",
				description:
					"Plated or family-style dinner service, staffing, and rentals coordination.",
				startingPriceCents: 12_500,
				priceUnit: "per_guest",
				isPrimary: true,
				packages: [
					{
						name: "Family-Style Dinner",
						description: "Three shared courses, service staff included.",
						priceCents: 12_500,
						priceUnit: "per_guest",
					},
					{
						name: "Plated Tasting Menu",
						description: "Five-course plated dinner with wine pairings.",
						priceCents: 18_500,
						priceUnit: "per_guest",
					},
				],
			},
			{
				categorySlug: "cake-desserts",
				description: "Dessert tables and tiered cakes baked in-house.",
				startingPriceCents: 45_000,
				packages: [
					{
						name: "Signature Tiered Cake",
						description: "Three-tier cake serving up to 120.",
						priceCents: 45_000,
					},
				],
			},
		],
	},
	{
		clerkId: "seed_vendor_knot_co",
		email: "plan@knotandco.test",
		name: "Sofia Reyes",
		subscriptionTier: "pro",
		business: {
			businessName: "Knot & Co. Events",
			tagline: "Full-service planning for couples who'd rather be present",
			bio: "From venue scouting to the last vendor invoice, we run the logistics so you can actually enjoy the day.",
			website: "https://knotandco.test",
			city: "Seattle",
			region: "Washington",
			yearsInBusiness: 8,
			isVerified: true,
		},
		services: [
			{
				categorySlug: "planning",
				description:
					"Full-service planning, vendor management, and day-of coordination.",
				startingPriceCents: 350_000,
				isPrimary: true,
				packages: [
					{
						name: "Month-Of Coordination",
						description: "We take over six weeks out and run the day.",
						priceCents: 350_000,
					},
					{
						name: "Full Planning",
						description:
							"Twelve months of planning, design, and vendor management.",
						priceCents: 950_000,
					},
				],
			},
		],
	},
	{
		clerkId: "seed_vendor_midnight_sound",
		email: "bookings@midnightsound.test",
		name: "Devon Clarke",
		business: {
			businessName: "Midnight Sound",
			tagline: "Open-format DJs who read the room, not a playlist",
			bio: "Two decades of wedding floors. We handle ceremony sound, cocktail hour, and a reception that doesn't empty out at ten.",
			website: "https://midnightsound.test",
			city: "Seattle",
			region: "Washington",
			yearsInBusiness: 14,
		},
		services: [
			{
				categorySlug: "music-dj",
				description:
					"DJ and MC services, ceremony and reception sound, dance lighting.",
				startingPriceCents: 220_000,
				isPrimary: true,
				packages: [
					{
						name: "Reception DJ",
						description: "Five hours, MC, and dance-floor lighting.",
						priceCents: 220_000,
					},
					{
						name: "Full-Day Sound",
						description:
							"Ceremony, cocktail hour, and reception coverage with backup gear.",
						priceCents: 310_000,
					},
				],
			},
		],
	},
] as const;

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
	await db
		.insert(vendorServices)
		.values({
			vendorBusinessId,
			categoryId,
			description: service.description,
			startingPriceCents: service.startingPriceCents,
			priceUnit: service.priceUnit ?? "flat",
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
export async function seedVendors() {
	const categoryRows = await db
		.select({ id: categories.id, slug: categories.slug })
		.from(categories);
	const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

	for (const vendor of VENDOR_SEED) {
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
