import { subDays } from "date-fns";
import type { SeedCouple, SeedPeerReview, SeedReview } from "./couples";

/**
 * Deterministic couple generator, mirroring vendor-generator. Given a count it
 * produces the same couples every run (seeded PRNG + index-based Clerk ids), so
 * the seed stays idempotent. It emits weddings in the past, confirmed-booking
 * plans against the *seeded* vendors (by index, resolved at seed time), and the
 * client + peer reviews those bookings authorize. `now` is injected so the only
 * run-varying value (the wedding date) is explicit rather than a hidden clock.
 */

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
	return items[Math.floor(rng() * items.length)] as T;
}

function int(rng: Rng, min: number, max: number) {
	return min + Math.floor(rng() * (max - min + 1));
}

function chance(rng: Rng, probability: number) {
	return rng() < probability;
}

function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
	const pool = [...items];
	const out: T[] = [];
	for (let i = 0; i < count && pool.length > 0; i++) {
		out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0] as T);
	}
	return out;
}

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
	"Ines",
	"Sam",
	"Yara",
	"Noah",
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
	{ city: "Savannah", region: "Georgia" },
] as const;

const STYLE_TAGS = [
	"Modern",
	"Rustic",
	"Boho",
	"Classic",
	"Minimalist",
	"Garden",
	"Coastal",
	"Vintage",
	"Romantic",
	"Industrial",
] as const;

const PALETTE = [
	"#F4E9E1",
	"#C7A17A",
	"#8C5A3B",
	"#2E2A26",
	"#6B7F5E",
	"#A8443B",
	"#E3B23C",
	"#3F5E7A",
	"#D98C8C",
	"#4A5240",
] as const;

const CLIENT_REVIEW_BODIES = [
	"They made our day completely effortless — every detail handled with care.",
	"Professional, warm, and genuinely talented. We couldn't recommend them more.",
	"From the first call to the last dance, they were a dream to work with.",
	"Communication was flawless and the results far exceeded our expectations.",
	"Kind, calm, and incredibly organized. Our guests are still talking about it.",
	"Worth every penny. They understood our vision immediately.",
	"", // some reviews are a rating with no words
] as const;

const PEER_REVIEW_BODIES = [
	"A pleasure to share a timeline with — organized and easy to coordinate with.",
	"Total professionals on-site. I'd happily work alongside them again.",
	"Great communication in the lead-up and calm under pressure on the day.",
	"They set the standard for how a vendor team should run.",
	"Seamless to collaborate with from load-in to last dance.",
	"",
] as const;

function makeRatings(rng: Rng, overall: number): Record<string, number> {
	const near = () => Math.min(5, Math.max(1, overall + int(rng, -1, 1)));
	return {
		professionalism: near(),
		communication: near(),
		quality: near(),
	};
}

function makeRatingAndBody(rng: Rng, bodies: readonly string[]) {
	// Weighted toward happy couples: mostly 4–5, the occasional 3.
	const overall = chance(rng, 0.75) ? 5 : chance(rng, 0.7) ? 4 : 3;
	return {
		overallRating: overall,
		ratings: makeRatings(rng, overall),
		body: pick(rng, bodies),
	};
}

export function generateCouples(
	count: number,
	vendorCount: number,
	now: Date,
): SeedCouple[] {
	const rng = makeRng(0xc0_11ab);
	const couples: SeedCouple[] = [];
	if (vendorCount <= 0) return couples;

	for (let i = 0; i < count; i++) {
		const ownerFirst = pick(rng, FIRST_NAMES);
		const lastName = pick(rng, LAST_NAMES);
		const location = pick(rng, LOCATIONS);
		const hasPartner = chance(rng, 0.75);
		const partnerFirst = pick(rng, FIRST_NAMES);

		// Spread bookings across the vendor catalogue so most listings get reviews.
		const bookedCount = Math.min(int(rng, 2, 3), vendorCount);
		const base = (i * 3) % vendorCount;
		const offsets = [0, 7, 13];
		const bookedVendorIndices = [
			...new Set(offsets.map((o) => (base + o) % vendorCount)),
		].slice(0, bookedCount);

		// The couple reviews most (not always all) of the vendors they booked.
		const clientReviews: SeedReview[] = bookedVendorIndices
			.filter(() => chance(rng, 0.8))
			.map((vendorIndex) => ({
				vendorIndex,
				...makeRatingAndBody(rng, CLIENT_REVIEW_BODIES),
			}));

		// Co-booked vendors endorse each other, building peer reputation.
		const peerReviews: SeedPeerReview[] = [];
		if (bookedVendorIndices.length >= 2 && chance(rng, 0.6)) {
			for (const authorVendorIndex of bookedVendorIndices) {
				for (const subjectVendorIndex of bookedVendorIndices) {
					if (authorVendorIndex === subjectVendorIndex) continue;
					if (!chance(rng, 0.7)) continue;
					peerReviews.push({
						authorVendorIndex,
						subjectVendorIndex,
						...makeRatingAndBody(rng, PEER_REVIEW_BODIES),
					});
				}
			}
		}

		couples.push({
			clerkId: `seed_couple_gen_${i}`,
			email: `seed-couple-${i}@couples.test`,
			name: `${ownerFirst} ${lastName}`,
			partner: hasPartner
				? {
						clerkId: `seed_partner_gen_${i}`,
						email: `seed-partner-${i}@couples.test`,
						name: `${partnerFirst} ${lastName}`,
					}
				: null,
			wedding: {
				weddingDate: subDays(now, int(rng, 30, 400)),
				city: location.city,
				region: location.region,
				estimatedBudgetCents: int(rng, 20_000, 90_000) * 100,
				guestCountEstimate: int(rng, 40, 220),
				styleTags: sample(rng, STYLE_TAGS, int(rng, 1, 3)),
				stylePalette: sample(rng, PALETTE, int(rng, 2, 4)),
			},
			bookedVendorIndices,
			clientReviews,
			peerReviews,
		});
	}

	return couples;
}
