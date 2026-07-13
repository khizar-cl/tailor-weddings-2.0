import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import { categories, db } from "../../db";

/** Resolve an active category's internal id by uuid, or throw NOT_FOUND. */
export async function resolveActiveCategoryId(categoryUuid: string) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.uuid, categoryUuid),
		columns: { id: true, isActive: true },
	});
	if (!category?.isActive) {
		throw new ORPCError("NOT_FOUND", { message: "Category not found" });
	}
	return category.id;
}

export async function listCategories() {
	const rows = await db.query.categories.findMany({
		where: eq(categories.isActive, true),
		columns: { uuid: true, slug: true, name: true },
		orderBy: [asc(categories.sortOrder), asc(categories.name)],
	});

	return { categories: rows };
}
