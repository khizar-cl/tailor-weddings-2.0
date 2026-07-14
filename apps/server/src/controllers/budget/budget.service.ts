import { ORPCError } from "@orpc/server";
import type {
	AddBudgetItemInputSchema,
	BudgetItemSchema,
	BudgetListSchema,
	UpdateBudgetItemInputSchema,
} from "@repo/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { budgetItems, categories, db } from "../../db";
import {
	coupleWeddingWhere,
	getOwnedWeddingId,
} from "../wedding/wedding-access";

interface BudgetItemRow {
	uuid: string;
	customCategory: string | null;
	label: string;
	estimatedCents: number | null;
	actualCents: number | null;
	source: "generated" | "manual" | "booking";
	category: { uuid: string; name: string } | null;
	vendorBusiness: { uuid: string; businessName: string } | null;
}

const budgetItemWith = {
	columns: {
		uuid: true,
		customCategory: true,
		label: true,
		estimatedCents: true,
		actualCents: true,
		source: true,
	},
	with: {
		category: { columns: { uuid: true, name: true } },
		vendorBusiness: { columns: { uuid: true, businessName: true } },
	},
} as const;

function toBudgetItem(row: BudgetItemRow): BudgetItemSchema {
	return {
		uuid: row.uuid,
		category: row.category?.name ?? row.customCategory ?? "",
		categoryUuid: row.category?.uuid ?? null,
		label: row.label,
		estimatedCents: row.estimatedCents,
		actualCents: row.actualCents,
		source: row.source,
		vendorBusinessUuid: row.vendorBusiness?.uuid ?? null,
		vendorBusinessName: row.vendorBusiness?.businessName ?? null,
	};
}

/**
 * Resolve the couple's category choice into the columns to persist — a seeded
 * `categoryId` or free-text `customCategory`, never both (the input's XOR refine
 * and the DB check constraint both guard this).
 */
async function resolveCategoryColumns(input: {
	categoryUuid?: string;
	customCategory?: string;
}) {
	if (input.categoryUuid) {
		const category = await db.query.categories.findFirst({
			where: and(
				eq(categories.uuid, input.categoryUuid),
				eq(categories.isActive, true),
			),
			columns: { id: true },
		});
		if (!category) {
			throw new ORPCError("NOT_FOUND", { message: "Category not found" });
		}
		return { categoryId: category.id, customCategory: null };
	}
	return { categoryId: null, customCategory: input.customCategory ?? null };
}

/** Owner or partner may read the budget (partner has read-only access). */
async function getReadableWedding(dbUserId: number) {
	const wedding = await db.query.weddings.findFirst({
		where: coupleWeddingWhere(dbUserId),
		columns: { id: true, estimatedBudgetCents: true },
	});
	if (!wedding) {
		throw new ORPCError("NOT_FOUND", { message: "Wedding not found" });
	}
	return wedding;
}

async function loadItemOrThrow(weddingId: number, uuid: string) {
	const row = await db.query.budgetItems.findFirst({
		where: and(
			eq(budgetItems.uuid, uuid),
			eq(budgetItems.weddingId, weddingId),
			isNull(budgetItems.deletedAt),
		),
		...budgetItemWith,
	});
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Budget item not found" });
	}
	return toBudgetItem(row);
}

export async function listBudget(dbUserId: number): Promise<BudgetListSchema> {
	const wedding = await getReadableWedding(dbUserId);
	const rows = await db.query.budgetItems.findMany({
		where: and(
			eq(budgetItems.weddingId, wedding.id),
			isNull(budgetItems.deletedAt),
		),
		orderBy: [asc(budgetItems.id)],
		...budgetItemWith,
	});

	// Category is now a resolved display name (from a join or custom text), so
	// group by sorting that name; the id ordering above keeps ties stable.
	const items = rows
		.map(toBudgetItem)
		.sort((a, b) => a.category.localeCompare(b.category));
	const estimatedCents = items.reduce(
		(sum, item) => sum + (item.estimatedCents ?? 0),
		0,
	);
	const actualCents = items.reduce(
		(sum, item) => sum + (item.actualCents ?? 0),
		0,
	);

	return {
		items,
		totals: {
			estimatedBudgetCents: wedding.estimatedBudgetCents,
			estimatedCents,
			actualCents,
		},
	};
}

export async function addBudgetItem(
	dbUserId: number,
	input: AddBudgetItemInputSchema,
) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const categoryColumns = await resolveCategoryColumns(input);
	const [inserted] = await db
		.insert(budgetItems)
		.values({
			weddingId,
			...categoryColumns,
			label: input.label,
			estimatedCents: input.estimatedCents ?? null,
			actualCents: input.actualCents ?? null,
			source: "manual",
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})
		.returning({ uuid: budgetItems.uuid });
	if (!inserted) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to add budget item",
		});
	}
	return loadItemOrThrow(weddingId, inserted.uuid);
}

export async function updateBudgetItem(
	dbUserId: number,
	input: UpdateBudgetItemInputSchema,
) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const categoryColumns = await resolveCategoryColumns(input);
	const [row] = await db
		.update(budgetItems)
		.set({
			...categoryColumns,
			label: input.label,
			estimatedCents: input.estimatedCents ?? null,
			actualCents: input.actualCents ?? null,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(budgetItems.uuid, input.uuid),
				eq(budgetItems.weddingId, weddingId),
				isNull(budgetItems.deletedAt),
			),
		)
		.returning({ uuid: budgetItems.uuid });
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Budget item not found" });
	}
	return loadItemOrThrow(weddingId, row.uuid);
}

export async function deleteBudgetItem(dbUserId: number, uuid: string) {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const [row] = await db
		.update(budgetItems)
		.set({ deletedAt: new Date(), updatedBy: dbUserId, updatedAt: new Date() })
		.where(
			and(
				eq(budgetItems.uuid, uuid),
				eq(budgetItems.weddingId, weddingId),
				isNull(budgetItems.deletedAt),
			),
		)
		.returning({ id: budgetItems.id });
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Budget item not found" });
	}
	return { deleted: true };
}
