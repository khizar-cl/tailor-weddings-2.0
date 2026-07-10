import type { PriceUnit } from "@repo/shared";
import type { SeedPackage, SeedVendor } from "./vendors";

/**
 * Deterministic vendor generator. Given a count, it produces the same set of
 * synthetic vendors every run (seeded PRNG + index-based Clerk ids), so the
 * seed stays idempotent while still exercising discovery at scale. Prices are
 * carried by packages only — the service starting price is derived from them
 * (see seedVendorService), matching the app's behaviour.
 */

// A tiny seedable PRNG (mulberry32) — deterministic across runs, no Date/random.
function makeRng(seed: number) {
	let state = seed;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

type Rng = () => number;

function pick<T>(rng: Rng, items: readonly T[]): T {
	// items is never empty at any call site below.
	return items[Math.floor(rng() * items.length)] as T;
}

function int(rng: Rng, min: number, max: number) {
	return min + Math.floor(rng() * (max - min + 1));
}

function chance(rng: Rng, probability: number) {
	return rng() < probability;
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

interface CategoryProfile {
	slug: string;
	/** Words used to build a plausible business name for this category. */
	nouns: readonly string[];
	unit: PriceUnit;
	/** Package price range in whole dollars. */
	priceRange: readonly [number, number];
	packageNames: readonly string[];
	serviceDescription: string;
}

const CATEGORY_PROFILES: readonly CategoryProfile[] = [
	{
		slug: "venue",
		nouns: ["Barn", "Estate", "Hall", "Manor", "Gardens", "Vineyard"],
		unit: "flat",
		priceRange: [6000, 24000],
		packageNames: ["Weekday Hire", "Saturday Full Weekend", "Micro-Wedding"],
		serviceDescription:
			"Exclusive venue hire with tables, chairs, and an on-site coordinator.",
	},
	{
		slug: "photography",
		nouns: ["Studio", "Photography", "Films", "Frames"],
		unit: "flat",
		priceRange: [2500, 8000],
		packageNames: ["Elopement Half-Day", "Full Celebration", "Heirloom Album"],
		serviceDescription:
			"Documentary wedding photography with a hand-edited gallery.",
	},
	{
		slug: "videography",
		nouns: ["Films", "Motion", "Reels", "Studio"],
		unit: "flat",
		priceRange: [3000, 9000],
		packageNames: ["Highlight Film", "Feature Edit", "Full Ceremony"],
		serviceDescription:
			"Cinematic wedding films — highlight reel plus full-ceremony edit.",
	},
	{
		slug: "planning",
		nouns: ["Events", "Co.", "Planning", "Collective"],
		unit: "flat",
		priceRange: [1500, 12000],
		packageNames: [
			"Month-Of Coordination",
			"Partial Planning",
			"Full Planning",
		],
		serviceDescription:
			"Full-service planning, vendor management, and day-of coordination.",
	},
	{
		slug: "floral",
		nouns: ["Florals", "Botanicals", "Stem & Co.", "Flowers"],
		unit: "flat",
		priceRange: [1500, 6000],
		packageNames: [
			"Bridal Essentials",
			"Ceremony Design",
			"Full Floral Design",
		],
		serviceDescription:
			"Bridal florals, ceremony installations, and reception centerpieces.",
	},
	{
		slug: "catering",
		nouns: ["Kitchen", "Table", "Catering", "Feast Co."],
		unit: "per_guest",
		priceRange: [55, 220],
		packageNames: ["Family-Style Dinner", "Plated Menu", "Grazing Stations"],
		serviceDescription:
			"Seasonal, source-local menus with full service staffing.",
	},
	{
		slug: "cake-desserts",
		nouns: ["Bakehouse", "Patisserie", "Sweets", "Cakery"],
		unit: "flat",
		priceRange: [400, 1600],
		packageNames: ["Signature Tiered Cake", "Dessert Table", "Cutting Cake"],
		serviceDescription: "Tiered cakes and dessert tables baked in-house.",
	},
	{
		slug: "music-dj",
		nouns: ["Sound", "Records", "DJ Co.", "Audio"],
		unit: "flat",
		priceRange: [1500, 4000],
		packageNames: ["Reception DJ", "Full-Day Sound", "Ceremony + Reception"],
		serviceDescription: "DJ and MC services with ceremony and reception sound.",
	},
	{
		slug: "live-band",
		nouns: ["Band", "Orchestra", "Ensemble", "Quartet"],
		unit: "flat",
		priceRange: [3000, 9000],
		packageNames: ["Four-Piece Set", "Full Band", "Ceremony Strings"],
		serviceDescription: "Live wedding music for ceremony and reception.",
	},
	{
		slug: "hair-makeup",
		nouns: ["Beauty", "Artistry", "Studio", "Glam Co."],
		unit: "flat",
		priceRange: [300, 1400],
		packageNames: ["Bridal Hair & Makeup", "Bridal Party", "Trial + Day-Of"],
		serviceDescription:
			"On-location bridal hair and makeup for you and your party.",
	},
	{
		slug: "officiant",
		nouns: ["Ceremonies", "Officiants", "Vows Co."],
		unit: "flat",
		priceRange: [300, 1200],
		packageNames: ["Ceremony Only", "Custom Ceremony", "Rehearsal + Ceremony"],
		serviceDescription: "Personalised ceremony writing and officiating.",
	},
	{
		slug: "stationery",
		nouns: ["Press", "Paper Co.", "Stationery", "Studio"],
		unit: "flat",
		priceRange: [500, 3000],
		packageNames: ["Save-the-Dates", "Invitation Suite", "Full Paper Goods"],
		serviceDescription: "Custom invitations, signage, and day-of paper goods.",
	},
	{
		slug: "rentals",
		nouns: ["Rentals", "Collective", "Supply Co.", "Hire"],
		unit: "flat",
		priceRange: [1000, 8000],
		packageNames: ["Essentials Package", "Lounge Set", "Full Event Rentals"],
		serviceDescription: "Tables, seating, linens, and specialty rentals.",
	},
	{
		slug: "transportation",
		nouns: ["Motors", "Transport", "Carriage Co.", "Rides"],
		unit: "hourly",
		priceRange: [120, 380],
		packageNames: ["Classic Car", "Guest Shuttle", "Getaway Ride"],
		serviceDescription: "Wedding-day transport for couple and guests.",
	},
	{
		slug: "attire",
		nouns: ["Atelier", "Bridal", "Tailors", "Couture"],
		unit: "flat",
		priceRange: [1000, 6000],
		packageNames: ["Off-the-Rack", "Made-to-Measure", "Bespoke Gown"],
		serviceDescription: "Bridal gowns and suiting, fitted to you.",
	},
];

const NAME_PREFIXES = [
	"Golden",
	"Wild",
	"Ivory",
	"Willow",
	"Cedar",
	"Rosewood",
	"Harbor",
	"Meadow",
	"Aster",
	"Juniper",
	"Marigold",
	"Slate",
	"Fern",
	"Hazel",
	"Coastal",
	"Northern",
	"Amber",
	"Laurel",
] as const;

const FIRST_NAMES = [
	"Amara",
	"Theo",
	"Priya",
	"Marcus",
	"Sofia",
	"Devon",
	"Elena",
	"Jonah",
	"Nadia",
	"Kai",
	"Rosa",
	"Owen",
	"Lena",
	"Malik",
	"Cora",
	"Ravi",
] as const;

const LAST_NAMES = [
	"Okafor",
	"Marsh",
	"Nair",
	"Bell",
	"Reyes",
	"Clarke",
	"Nguyen",
	"Bauer",
	"Costa",
	"Idris",
	"Sato",
	"Flynn",
	"Mensah",
	"Rossi",
	"Park",
	"Duval",
] as const;

const LOCATIONS = [
	{ city: "Portland", region: "Oregon" },
	{ city: "Seattle", region: "Washington" },
	{ city: "Austin", region: "Texas" },
	{ city: "Denver", region: "Colorado" },
	{ city: "Nashville", region: "Tennessee" },
	{ city: "Charleston", region: "South Carolina" },
	{ city: "Asheville", region: "North Carolina" },
	{ city: "Santa Fe", region: "New Mexico" },
	{ city: "San Diego", region: "California" },
	{ city: "Minneapolis", region: "Minnesota" },
	{ city: "Savannah", region: "Georgia" },
	{ city: "Hudson", region: "New York" },
] as const;

function buildPackages(rng: Rng, profile: CategoryProfile): SeedPackage[] {
	const [min, max] = profile.priceRange;
	const packageCount = int(rng, 1, 3);
	// Ascending prices so the cheapest (derived starting price) reads naturally.
	const prices = Array.from({ length: packageCount }, () =>
		int(rng, min, max),
	).sort((a, b) => a - b);
	return prices.map((dollars, index) => ({
		name: profile.packageNames[index] ?? `Package ${index + 1}`,
		description: `${profile.packageNames[index] ?? "Package"} — tailored to your day.`,
		priceCents: dollars * 100,
		priceUnit: profile.unit,
	}));
}

export function generateVendors(count: number): SeedVendor[] {
	const rng = makeRng(0x7e0f_c0de);
	const vendors: SeedVendor[] = [];

	for (let i = 0; i < count; i++) {
		const firstName = pick(rng, FIRST_NAMES);
		const lastName = pick(rng, LAST_NAMES);
		const location = pick(rng, LOCATIONS);
		const tier = chance(rng, 0.3) ? "pro" : "free";

		// Primary category cycles so all categories get coverage; pro accounts may
		// offer a couple more (free tier is capped at one service).
		const primary = CATEGORY_PROFILES[i % CATEGORY_PROFILES.length];
		if (!primary) continue;
		const chosen: CategoryProfile[] = [primary];
		if (tier === "pro") {
			const extras = int(rng, 0, 2);
			for (let e = 0; e < extras; e++) {
				const candidate = pick(rng, CATEGORY_PROFILES);
				if (!chosen.some((c) => c.slug === candidate.slug)) {
					chosen.push(candidate);
				}
			}
		}

		const prefix = pick(rng, NAME_PREFIXES);
		const noun = pick(rng, primary.nouns);
		const businessName = `${prefix} ${noun}`;
		const slug = slugify(businessName);

		vendors.push({
			clerkId: `seed_vendor_gen_${i}`,
			email: `seed-vendor-${i}@vendors.test`,
			name: `${firstName} ${lastName}`,
			subscriptionTier: tier,
			business: {
				businessName,
				tagline: `${businessName} — ${primary.serviceDescription}`,
				bio: `${businessName} is a ${location.city}-based team with ${int(rng, 2, 18)} years of weddings behind us. We bring calm, craft, and a genuine love of the day to every couple we work with.`,
				website: `https://${slug}.test`,
				city: location.city,
				region: location.region,
				yearsInBusiness: int(rng, 1, 20),
				isVerified: chance(rng, 0.4),
			},
			services: chosen.map((profile, index) => ({
				categorySlug: profile.slug,
				description: profile.serviceDescription,
				isPrimary: index === 0,
				packages: buildPackages(rng, profile),
			})),
		});
	}

	return vendors;
}
