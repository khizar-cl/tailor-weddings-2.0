import { asc, eq } from "drizzle-orm";
import { categories, db } from "../../db";

export async function listCategories() {
	const rows = await db.query.categories.findMany({
		where: eq(categories.isActive, true),
		columns: { uuid: true, slug: true, name: true },
		orderBy: [asc(categories.sortOrder), asc(categories.name)],
	});

	return { categories: rows };
}
