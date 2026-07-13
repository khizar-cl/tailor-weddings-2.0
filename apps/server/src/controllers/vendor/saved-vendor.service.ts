import { ORPCError } from "@orpc/server";
import type {
	SavedVendorListSchema,
	SavedVendorSchema,
	SaveVendorInputSchema,
	UnsaveVendorInputSchema,
	UnsaveVendorResultSchema,
} from "@repo/shared";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import {
	categories,
	db,
	savedVendors,
	vendorBusinesses,
	vendorServices,
} from "../../db";
import { getCoupleWeddingId } from "../wedding/wedding-access";
import { presignLogosByFileId } from "./vendor.helpers";

interface SavedRow {
	uuid: string;
	notes: string | null;
	savedAt: Date;
	vendorBusiness: {
		id: number;
		uuid: string;
		businessName: string;
		city: string | null;
		region: string | null;
		isVerified: boolean;
		logoFileId: number | null;
	};
}

async function assembleSavedVendors(
	rows: SavedRow[],
): Promise<SavedVendorSchema[]> {
	if (rows.length === 0) return [];

	const businessIds = rows.map((row) => row.vendorBusiness.id);

	const [primaryRows, logoUrlByFileId] = await Promise.all([
		db
			.select({
				businessId: vendorServices.vendorBusinessId,
				categoryName: categories.name,
			})
			.from(vendorServices)
			.innerJoin(categories, eq(categories.id, vendorServices.categoryId))
			.where(
				and(
					inArray(vendorServices.vendorBusinessId, businessIds),
					eq(vendorServices.isPrimary, true),
					isNull(vendorServices.deletedAt),
				),
			),
		presignLogosByFileId(rows.map((row) => row.vendorBusiness.logoFileId)),
	]);

	const primaryByBusiness = new Map(
		primaryRows.map((row) => [row.businessId, row.categoryName]),
	);

	return rows.map((row) => ({
		uuid: row.uuid,
		vendorBusinessUuid: row.vendorBusiness.uuid,
		businessName: row.vendorBusiness.businessName,
		city: row.vendorBusiness.city,
		region: row.vendorBusiness.region,
		isVerified: row.vendorBusiness.isVerified,
		logoUrl:
			row.vendorBusiness.logoFileId === null
				? null
				: (logoUrlByFileId.get(row.vendorBusiness.logoFileId) ?? null),
		primaryCategoryName: primaryByBusiness.get(row.vendorBusiness.id) ?? null,
		notes: row.notes,
		savedAt: row.savedAt,
	}));
}

async function resolveVendorBusinessId(uuid: string) {
	const business = await db.query.vendorBusinesses.findFirst({
		where: and(
			eq(vendorBusinesses.uuid, uuid),
			isNull(vendorBusinesses.deletedAt),
		),
		columns: { id: true },
	});
	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
	}
	return business.id;
}

export async function listSavedVendors(
	dbUserId: number,
): Promise<SavedVendorListSchema> {
	const weddingId = await getCoupleWeddingId(dbUserId);
	const rows = await db.query.savedVendors.findMany({
		where: and(
			eq(savedVendors.weddingId, weddingId),
			isNull(savedVendors.deletedAt),
		),
		orderBy: [desc(savedVendors.savedAt), desc(savedVendors.id)],
		columns: { uuid: true, notes: true, savedAt: true },
		with: {
			vendorBusiness: {
				columns: {
					id: true,
					uuid: true,
					businessName: true,
					city: true,
					region: true,
					isVerified: true,
					logoFileId: true,
					deletedAt: true,
				},
			},
		},
	});

	const visible = rows.filter((row) => row.vendorBusiness.deletedAt === null);
	return { items: await assembleSavedVendors(visible) };
}

export async function saveVendor(
	dbUserId: number,
	input: SaveVendorInputSchema,
): Promise<SavedVendorSchema> {
	const weddingId = await getCoupleWeddingId(dbUserId);
	const vendorBusinessId = await resolveVendorBusinessId(
		input.vendorBusinessUuid,
	);

	// Re-saving a previously removed vendor revives the soft-deleted row.
	const [row] = await db
		.insert(savedVendors)
		.values({
			weddingId,
			vendorBusinessId,
			notes: input.notes ?? null,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})
		.onConflictDoUpdate({
			target: [savedVendors.weddingId, savedVendors.vendorBusinessId],
			set: {
				notes: input.notes ?? null,
				deletedAt: null,
				savedAt: new Date(),
				updatedBy: dbUserId,
				updatedAt: new Date(),
			},
		})
		.returning({
			uuid: savedVendors.uuid,
			notes: savedVendors.notes,
			savedAt: savedVendors.savedAt,
		});
	if (!row) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to save vendor",
		});
	}

	const business = await db.query.vendorBusinesses.findFirst({
		where: eq(vendorBusinesses.id, vendorBusinessId),
		columns: {
			id: true,
			uuid: true,
			businessName: true,
			city: true,
			region: true,
			isVerified: true,
			logoFileId: true,
		},
	});
	if (!business) {
		throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
	}

	const [assembled] = await assembleSavedVendors([
		{ ...row, vendorBusiness: business },
	]);
	if (!assembled) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to save vendor",
		});
	}
	return assembled;
}

export async function unsaveVendor(
	dbUserId: number,
	input: UnsaveVendorInputSchema,
): Promise<UnsaveVendorResultSchema> {
	const weddingId = await getCoupleWeddingId(dbUserId);
	const vendorBusinessId = await resolveVendorBusinessId(
		input.vendorBusinessUuid,
	);

	const removed = await db
		.update(savedVendors)
		.set({ deletedAt: new Date(), updatedBy: dbUserId, updatedAt: new Date() })
		.where(
			and(
				eq(savedVendors.weddingId, weddingId),
				eq(savedVendors.vendorBusinessId, vendorBusinessId),
				isNull(savedVendors.deletedAt),
			),
		)
		.returning({ id: savedVendors.id });

	return { removed: removed.length > 0 };
}
