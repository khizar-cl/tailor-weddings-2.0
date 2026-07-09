import { logger } from "../../utils/logger";
import { pool } from "..";
import { seedCategories } from "./categories";
import { seedVendors } from "./vendors";

async function main() {
	logger.info("Seeding database…");
	await seedCategories();
	await seedVendors();
	logger.info("Seed complete");
}

main()
	.catch((err) => {
		logger.error({ err }, "Seed failed");
		process.exitCode = 1;
	})
	.finally(async () => {
		await pool.end();
	});
