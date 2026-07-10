import { logger } from "../../utils/logger";
import { pool } from "..";
import { seedCategories } from "./categories";
import { generateVendors } from "./vendor-generator";
import { seedVendors } from "./vendors";

const GENERATED_COUNT = Number(process.env.SEED_VENDOR_COUNT ?? 100);

async function main() {
	logger.info("Seeding database…");
	await seedCategories();

	const generated = generateVendors(
		Number.isFinite(GENERATED_COUNT) && GENERATED_COUNT > 0
			? GENERATED_COUNT
			: 100,
	);
	await seedVendors(generated);

	logger.info({ generated: generated.length }, "Seed complete");
}

main()
	.catch((err) => {
		logger.error({ err }, "Seed failed");
		process.exitCode = 1;
	})
	.finally(async () => {
		await pool.end();
	});
