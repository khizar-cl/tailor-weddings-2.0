import { ORPCError } from "@orpc/server";
import type {
	AddChecklistTaskInputSchema,
	ToggleChecklistTaskInputSchema,
} from "@repo/shared";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { categories, checklistItems, db, weddings } from "../../db";

interface ChecklistItemRow {
	uuid: string;
	title: string;
	description: string | null;
	dueDate: Date | null;
	isComplete: boolean;
	source: "generated" | "manual" | "booking";
	sortOrder: number;
	category: { uuid: string; name: string } | null;
}

function toChecklistItem(row: ChecklistItemRow) {
	return {
		uuid: row.uuid,
		title: row.title,
		description: row.description,
		category: row.category,
		dueDate: row.dueDate,
		isComplete: row.isComplete,
		source: row.source,
		sortOrder: row.sortOrder,
	};
}

/**
 * Resolve the wedding the caller owns. Checklist writes are owner-only; the
 * partner has read-only access to a wedding (see wedding.schema).
 */
async function getOwnedWeddingId(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.ownerUserId, dbUserId),
		columns: { id: true },
	});
	if (!wedding) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}
	return wedding.id;
}

/** Re-read a task (with its category) so mutations return the full shape. */
async function loadItemOrThrow(weddingId: number, uuid: string) {
	const row = await db.query.checklistItems.findFirst({
		where: and(
			eq(checklistItems.uuid, uuid),
			eq(checklistItems.weddingId, weddingId),
			isNull(checklistItems.deletedAt),
		),
		with: { category: { columns: { uuid: true, name: true } } },
	});
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Task not found" });
	}
	return toChecklistItem(row);
}

async function resolveCategoryId(categoryUuid: string) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.uuid, categoryUuid),
		columns: { id: true, isActive: true },
	});
	if (!category?.isActive) {
		throw new ORPCError("NOT_FOUND", { message: "Category not found" });
	}
	return category.id;
}

export async function listChecklist(dbUserId: number) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const rows = await db.query.checklistItems.findMany({
		where: and(
			eq(checklistItems.weddingId, weddingId),
			isNull(checklistItems.deletedAt),
		),
		orderBy: [asc(checklistItems.sortOrder), asc(checklistItems.id)],
		with: { category: { columns: { uuid: true, name: true } } },
	});
	return { items: rows.map(toChecklistItem) };
}

export async function addChecklistTask(
	dbUserId: number,
	input: AddChecklistTaskInputSchema,
) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const categoryId = input.categoryUuid
		? await resolveCategoryId(input.categoryUuid)
		: null;

	// Manual tasks sort after everything currently on the list.
	const last = await db.query.checklistItems.findFirst({
		where: eq(checklistItems.weddingId, weddingId),
		orderBy: [desc(checklistItems.sortOrder)],
		columns: { sortOrder: true },
	});
	const sortOrder = (last?.sortOrder ?? -1) + 1;

	const [inserted] = await db
		.insert(checklistItems)
		.values({
			weddingId,
			title: input.title,
			description: input.description ?? null,
			categoryId,
			dueDate: input.dueDate ?? null,
			source: "manual",
			sortOrder,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})
		.returning({ uuid: checklistItems.uuid });
	if (!inserted) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to add task",
		});
	}
	return loadItemOrThrow(weddingId, inserted.uuid);
}

export async function toggleChecklistTask(
	dbUserId: number,
	input: ToggleChecklistTaskInputSchema,
) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const [row] = await db
		.update(checklistItems)
		.set({
			isComplete: input.isComplete,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(checklistItems.uuid, input.uuid),
				eq(checklistItems.weddingId, weddingId),
				isNull(checklistItems.deletedAt),
			),
		)
		.returning({ uuid: checklistItems.uuid });
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Task not found" });
	}
	return loadItemOrThrow(weddingId, row.uuid);
}

export async function removeChecklistTask(dbUserId: number, uuid: string) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const [row] = await db
		.update(checklistItems)
		.set({ deletedAt: new Date(), updatedBy: dbUserId, updatedAt: new Date() })
		.where(
			and(
				eq(checklistItems.uuid, uuid),
				eq(checklistItems.weddingId, weddingId),
				isNull(checklistItems.deletedAt),
			),
		)
		.returning({ id: checklistItems.id });
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Task not found" });
	}
	return { deleted: true };
}
