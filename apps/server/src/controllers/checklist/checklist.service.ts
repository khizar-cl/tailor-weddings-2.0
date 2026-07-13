import { ORPCError } from "@orpc/server";
import type {
	AddChecklistTaskInputSchema,
	ToggleChecklistTaskInputSchema,
} from "@repo/shared";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { checklistItems, db } from "../../db";
import { resolveActiveCategoryId } from "../category/category.service";
import { getOwnedWeddingId } from "../wedding/wedding-access";

const MAX_CHECKLIST_ITEMS_PER_WEDDING = 100;

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

	const [live] = await db
		.select({ count: count() })
		.from(checklistItems)
		.where(
			and(
				eq(checklistItems.weddingId, weddingId),
				isNull(checklistItems.deletedAt),
			),
		);
	if ((live?.count ?? 0) >= MAX_CHECKLIST_ITEMS_PER_WEDDING) {
		throw new ORPCError("FORBIDDEN", {
			message: `Your checklist is full (max ${MAX_CHECKLIST_ITEMS_PER_WEDDING} tasks). Remove a task to add another.`,
		});
	}

	const categoryId = input.categoryUuid
		? await resolveActiveCategoryId(input.categoryUuid)
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
