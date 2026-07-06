import { categories, db } from "..";

/**
 * Canonical vendor service categories. Slugs are stable identifiers — rename the
 * `name` freely, but never repurpose a `slug` (it's what profiles resolve to).
 */
export const CATEGORY_SEED = [
	{ slug: "venue", name: "Venue", sortOrder: 10 },
	{ slug: "photography", name: "Photography", sortOrder: 20 },
	{ slug: "videography", name: "Videography", sortOrder: 30 },
	{ slug: "planning", name: "Planning & Coordination", sortOrder: 40 },
	{ slug: "floral", name: "Floral & Decor", sortOrder: 50 },
	{ slug: "catering", name: "Catering", sortOrder: 60 },
	{ slug: "cake-desserts", name: "Cake & Desserts", sortOrder: 70 },
	{ slug: "music-dj", name: "DJ & Music", sortOrder: 80 },
	{ slug: "live-band", name: "Live Band", sortOrder: 90 },
	{ slug: "hair-makeup", name: "Hair & Makeup", sortOrder: 100 },
	{ slug: "officiant", name: "Officiant", sortOrder: 110 },
	{ slug: "stationery", name: "Stationery & Invitations", sortOrder: 120 },
	{ slug: "rentals", name: "Rentals", sortOrder: 130 },
	{ slug: "transportation", name: "Transportation", sortOrder: 140 },
	{ slug: "attire", name: "Attire & Styling", sortOrder: 150 },
] as const;

/** Idempotent — safe to run repeatedly. Existing rows (by slug) are left as-is. */
export async function seedCategories() {
	await db
		.insert(categories)
		.values([...CATEGORY_SEED])
		.onConflictDoNothing({ target: categories.slug });
}
