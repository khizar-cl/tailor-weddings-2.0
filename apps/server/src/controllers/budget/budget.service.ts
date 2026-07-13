import { ORPCError } from "@orpc/server";
import type {
	AddBudgetItemInputSchema,
	BudgetItemSchema,
	BudgetListSchema,
	UpdateBudgetItemInputSchema,
} from "@repo/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { budgetItems, db } from "../../db";
import {
	coupleWeddingWhere,
	getOwnedWeddingId,
} from "../wedding/wedding-access";

interface BudgetItemRow {
	uuid: string;
	category: string;
	label: string;
	estimatedCents: number | null;
	actualCents: number | null;
	source: "generated" | "manual" | "booking";
	vendorBusiness: { uuid: string; businessName: string } | null;
}

function toBudgetItem(row: BudgetItemRow): BudgetItemSchema {
	return {
		uuid: row.uuid,
		category: row.category,
		label: row.label,
		estimatedCents: row.estimatedCents,
		actualCents: row.actualCents,
		source: row.source,
		vendorBusinessUuid: row.vendorBusiness?.uuid ?? null,
		vendorBusinessName: row.vendorBusiness?.businessName ?? null,
	};
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
		columns: {
			uuid: true,
			category: true,
			label: true,
			estimatedCents: true,
			actualCents: true,
			source: true,
		},
		with: {
			vendorBusiness: { columns: { uuid: true, businessName: true } },
		},
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
		orderBy: [asc(budgetItems.category), asc(budgetItems.id)],
		columns: {
			uuid: true,
			category: true,
			label: true,
			estimatedCents: true,
			actualCents: true,
			source: true,
		},
		with: {
			vendorBusiness: { columns: { uuid: true, businessName: true } },
		},
	});

	const items = rows.map(toBudgetItem);
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
	const [inserted] = await db
		.insert(budgetItems)
		.values({
			weddingId,
			category: input.category,
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
	const [row] = await db
		.update(budgetItems)
		.set({
			category: input.category,
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
