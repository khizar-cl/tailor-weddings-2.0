import { logger } from "../../utils/logger";
import { pool } from "..";
import { seedCategories } from "./categories";

async function main() {
	logger.info("Seeding database…");
	await seedCategories();
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
