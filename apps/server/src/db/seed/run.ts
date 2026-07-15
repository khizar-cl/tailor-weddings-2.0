import { logger } from "../../utils/logger";
import { pool } from "..";
import { seedCategories } from "./categories";
import { generateCouples } from "./couple-generator";
import { seedCouples } from "./couples";
import { generateVendors } from "./vendor-generator";
import { seedVendors } from "./vendors";

function positiveCount(raw: string | undefined, fallback: number) {
	const value = Number(raw ?? fallback);
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

const VENDOR_COUNT = positiveCount(process.env.SEED_VENDOR_COUNT, 100);
const COUPLE_COUNT = positiveCount(process.env.SEED_COUPLE_COUNT, 30);

async function main() {
	logger.info("Seeding database…");
	await seedCategories();

	const generated = generateVendors(VENDOR_COUNT);
	await seedVendors(generated);

	// Couples book and review the seeded vendors, so this must run after them.
	const couples = generateCouples(COUPLE_COUNT, generated.length, new Date());
	await seedCouples(couples);

	logger.info(
		{ vendors: generated.length, couples: couples.length },
		"Seed complete",
	);
}

main()
	.catch((err) => {
		logger.error({ err }, "Seed failed");
		process.exitCode = 1;
	})
	.finally(async () => {
		await pool.end();
	});
