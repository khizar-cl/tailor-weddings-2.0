import { ORPCError } from "@orpc/server";
import type {
	BookingListSchema,
	BookingSchema,
	RequestBookingInputSchema,
} from "@repo/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
	bookings,
	budgetItems,
	db,
	servicePackages,
	vendorBusinesses,
	vendorServices,
} from "../../db";
import { getOwnedBusiness, presignImage } from "../vendor/vendor.helpers";
import {
	getCoupleWeddingId,
	getOwnedWeddingId,
} from "../wedding/wedding-access";

/** Whose eyes the booking is rendered for — drives the counterparty fields. */
type Viewpoint = "couple" | "vendor";

const bookingWith = {
	columns: {
		uuid: true,
		status: true,
		bookedAt: true,
		confirmedAt: true,
		weddingId: true,
		vendorBusinessId: true,
		servicePackageId: true,
	},
	with: {
		vendorBusiness: {
			columns: {
				uuid: true,
				businessName: true,
				city: true,
				region: true,
			},
			with: { logo: { columns: { key: true, fileName: true } } },
		},
		wedding: {
			columns: { weddingDate: true, city: true, region: true },
			with: {
				owner: { columns: { name: true } },
				partner: { columns: { name: true } },
			},
		},
		servicePackage: {
			columns: { uuid: true, name: true, priceCents: true },
			with: {
				vendorService: {
					columns: { uuid: true, customLabel: true, categoryId: true },
					with: { category: { columns: { name: true } } },
				},
			},
		},
	},
} as const;

type BookingRow = NonNullable<Awaited<ReturnType<typeof loadBookingRow>>>;

function location(city: string | null, region: string | null) {
	const parts = [city, region].filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : null;
}

/** The service's public label — its category name, or its custom label. */
function serviceLabel(service: BookingRow["servicePackage"]["vendorService"]) {
	return service.category?.name ?? service.customLabel ?? null;
}

async function buildBooking(
	row: BookingRow,
	viewpoint: Viewpoint,
): Promise<BookingSchema> {
	const coupleName =
		[row.wedding.owner?.name, row.wedding.partner?.name]
			.filter(Boolean)
			.join(" & ") || "Couple";
	const isVendorView = viewpoint === "vendor";

	return {
		uuid: row.uuid,
		status: row.status,
		bookedAt: row.bookedAt,
		confirmedAt: row.confirmedAt,
		counterpartyKind: isVendorView ? "couple" : "vendor",
		title: isVendorView ? coupleName : row.vendorBusiness.businessName,
		subtitle: isVendorView
			? location(row.wedding.city, row.wedding.region)
			: location(row.vendorBusiness.city, row.vendorBusiness.region),
		// Couples see the vendor's logo; vendors have no couple avatar.
		avatarUrl: isVendorView
			? null
			: await presignImage(row.vendorBusiness.logo),
		vendorBusinessUuid: row.vendorBusiness.uuid,
		vendorServiceUuid: row.servicePackage.vendorService.uuid,
		serviceLabel: serviceLabel(row.servicePackage.vendorService),
		weddingDate: row.wedding.weddingDate,
		packageUuid: row.servicePackage.uuid,
		packageName: row.servicePackage.name,
		packagePriceCents: row.servicePackage.priceCents,
	};
}

function loadBookingRow(bookingId: number) {
	return db.query.bookings.findFirst({
		where: eq(bookings.id, bookingId),
		...bookingWith,
	});
}

async function buildById(
	bookingId: number,
	viewpoint: Viewpoint,
): Promise<BookingSchema> {
	const row = await loadBookingRow(bookingId);
	if (!row) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to load booking",
		});
	}
	return buildBooking(row, viewpoint);
}

/** A live, published vendor service by external uuid (+ its business), or NOT_FOUND. */
async function getServiceByUuid(uuid: string) {
	const service = await db.query.vendorServices.findFirst({
		where: and(
			eq(vendorServices.uuid, uuid),
			eq(vendorServices.isPublished, true),
			isNull(vendorServices.deletedAt),
		),
		columns: { id: true, vendorBusinessId: true },
	});
	if (!service) {
		throw new ORPCError("NOT_FOUND", { message: "Service not available" });
	}
	return service;
}

/**
 * Resolve a package uuid to its id + price, verifying it belongs to the service
 * being booked.
 */
async function resolvePackage(vendorServiceId: number, packageUuid: string) {
	const [row] = await db
		.select({ id: servicePackages.id, priceCents: servicePackages.priceCents })
		.from(servicePackages)
		.where(
			and(
				eq(servicePackages.uuid, packageUuid),
				eq(servicePackages.vendorServiceId, vendorServiceId),
				isNull(servicePackages.deletedAt),
			),
		);
	if (!row) {
		throw new ORPCError("NOT_FOUND", { message: "Package not found" });
	}
	return row;
}

/**
 * Upsert the `source:'booking'` budget line for a confirmed booking. Keyed on
 * the package — one live booking line per booked package — so re-confirming
 * updates it in place rather than duplicating. The line inherits the service's
 * category (its seeded categoryId, else its custom label as customCategory).
 */
async function upsertBookingBudgetLine(
	dbUserId: number,
	params: {
		weddingId: number;
		servicePackageId: number;
		vendorBusinessId: number;
		estimatedCents: number | null;
		categoryId: number | null;
		customCategory: string | null;
		label: string;
	},
) {
	const now = new Date();
	const existing = await db.query.budgetItems.findFirst({
		where: and(
			eq(budgetItems.weddingId, params.weddingId),
			eq(budgetItems.servicePackageId, params.servicePackageId),
			eq(budgetItems.source, "booking"),
			isNull(budgetItems.deletedAt),
		),
		columns: { id: true },
	});

	if (existing) {
		await db
			.update(budgetItems)
			.set({
				categoryId: params.categoryId,
				customCategory: params.customCategory,
				label: params.label,
				estimatedCents: params.estimatedCents,
				updatedBy: dbUserId,
				updatedAt: now,
			})
			.where(eq(budgetItems.id, existing.id));
		return;
	}

	await db.insert(budgetItems).values({
		weddingId: params.weddingId,
		categoryId: params.categoryId,
		customCategory: params.customCategory,
		label: params.label,
		estimatedCents: params.estimatedCents,
		vendorBusinessId: params.vendorBusinessId,
		servicePackageId: params.servicePackageId,
		source: "booking",
		createdBy: dbUserId,
		updatedBy: dbUserId,
	});
}

/** Reverse the budget line a confirmed booking created (soft-delete). */
async function removeBookingBudgetLine(
	dbUserId: number,
	weddingId: number,
	servicePackageId: number,
) {
	const now = new Date();
	await db
		.update(budgetItems)
		.set({ deletedAt: now, updatedBy: dbUserId, updatedAt: now })
		.where(
			and(
				eq(budgetItems.weddingId, weddingId),
				eq(budgetItems.servicePackageId, servicePackageId),
				eq(budgetItems.source, "booking"),
				isNull(budgetItems.deletedAt),
			),
		);
}

/**
 * The category a booking's budget line is filed under, derived from the booked
 * package's service: its seeded category, else its custom label. Exactly one is
 * set, satisfying the budget line's category XOR constraint.
 */
function bookingBudgetCategory(
	service: BookingRow["servicePackage"]["vendorService"],
) {
	if (service.categoryId !== null) {
		return { categoryId: service.categoryId, customCategory: null };
	}
	return { categoryId: null, customCategory: service.customLabel ?? "Vendors" };
}

/**
 * Couple requests to book a specific package. Idempotent on the unique
 * (wedding, package): a fresh request inserts a pending booking; re-requesting a
 * cancelled one flips it back to pending; a still-open (pending/confirmed)
 * booking is returned as-is. Booking a different package of the same service is
 * a separate booking.
 */
export async function requestBooking(
	dbUserId: number,
	input: RequestBookingInputSchema,
): Promise<BookingSchema> {
	const weddingId = await getOwnedWeddingId(dbUserId);
	const service = await getServiceByUuid(input.vendorServiceUuid);
	const pkg = await resolvePackage(service.id, input.servicePackageUuid);

	const existing = await db.query.bookings.findFirst({
		where: and(
			eq(bookings.weddingId, weddingId),
			eq(bookings.servicePackageId, pkg.id),
			isNull(bookings.deletedAt),
		),
		columns: { id: true, status: true },
	});

	if (!existing) {
		const [inserted] = await db
			.insert(bookings)
			.values({
				weddingId,
				vendorBusinessId: service.vendorBusinessId,
				servicePackageId: pkg.id,
				status: "pending",
				createdBy: dbUserId,
				updatedBy: dbUserId,
			})
			.returning({ id: bookings.id });
		if (!inserted) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to request booking",
			});
		}
		return buildById(inserted.id, "couple");
	}

	// A cancelled booking reopens as pending; a still-open one is returned as-is.
	if (existing.status === "cancelled") {
		await db
			.update(bookings)
			.set({
				status: "pending",
				confirmedAt: null,
				updatedBy: dbUserId,
				updatedAt: new Date(),
			})
			.where(eq(bookings.id, existing.id));
	}
	return buildById(existing.id, "couple");
}

/** The caller's booking scoped to their owned business, or NOT_FOUND. */
async function getOwnedBooking(dbUserId: number, bookingUuid: string) {
	const { businessId } = await getOwnedBusiness(dbUserId);
	const booking = await db.query.bookings.findFirst({
		where: and(eq(bookings.uuid, bookingUuid), isNull(bookings.deletedAt)),
		columns: { id: true, status: true, vendorBusinessId: true },
	});
	// Don't leak the existence of bookings for other vendors' businesses.
	if (!booking || booking.vendorBusinessId !== businessId) {
		throw new ORPCError("NOT_FOUND", { message: "Booking not found" });
	}
	return booking;
}

/**
 * Vendor confirms a pending request: stamps confirmedAt and auto-populates the
 * couple's budget with a `source:'booking'` line (the package price when set).
 */
export async function confirmBooking(
	dbUserId: number,
	bookingUuid: string,
): Promise<BookingSchema> {
	const owned = await getOwnedBooking(dbUserId, bookingUuid);
	if (owned.status === "confirmed") {
		return buildById(owned.id, "vendor");
	}
	if (owned.status !== "pending") {
		throw new ORPCError("CONFLICT", {
			message: "This booking can no longer be confirmed",
		});
	}

	const row = await loadBookingRow(owned.id);
	if (!row) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to load booking",
		});
	}

	const now = new Date();
	await db
		.update(bookings)
		.set({
			status: "confirmed",
			confirmedAt: now,
			updatedBy: dbUserId,
			updatedAt: now,
		})
		.where(eq(bookings.id, owned.id));

	await upsertBookingBudgetLine(dbUserId, {
		weddingId: row.weddingId,
		servicePackageId: row.servicePackageId,
		vendorBusinessId: row.vendorBusinessId,
		estimatedCents: row.servicePackage.priceCents,
		...bookingBudgetCategory(row.servicePackage.vendorService),
		label: row.vendorBusiness.businessName,
	});

	return buildById(owned.id, "vendor");
}

/**
 * Either party cancels. Plain status transition — no fees or refunds (nothing
 * is paid at booking time). Cancelling a confirmed booking reverses its budget
 * line; the couple sees it from their side, the vendor from theirs.
 */
export async function cancelBooking(
	dbUserId: number,
	bookingUuid: string,
): Promise<BookingSchema> {
	const booking = await db.query.bookings.findFirst({
		where: and(eq(bookings.uuid, bookingUuid), isNull(bookings.deletedAt)),
		columns: {
			id: true,
			status: true,
			weddingId: true,
			servicePackageId: true,
			vendorBusinessId: true,
		},
		with: { wedding: { columns: { ownerUserId: true } } },
	});
	if (!booking) {
		throw new ORPCError("NOT_FOUND", { message: "Booking not found" });
	}

	const isOwner = booking.wedding?.ownerUserId === dbUserId;
	const isVendor = await isOwnedBusiness(dbUserId, booking.vendorBusinessId);
	if (!isOwner && !isVendor) {
		throw new ORPCError("NOT_FOUND", { message: "Booking not found" });
	}
	const viewpoint: Viewpoint = isVendor ? "vendor" : "couple";

	if (booking.status === "cancelled") {
		return buildById(booking.id, viewpoint);
	}

	const now = new Date();
	await db
		.update(bookings)
		.set({ status: "cancelled", updatedBy: dbUserId, updatedAt: now })
		.where(eq(bookings.id, booking.id));

	if (booking.status === "confirmed") {
		await removeBookingBudgetLine(
			dbUserId,
			booking.weddingId,
			booking.servicePackageId,
		);
	}

	return buildById(booking.id, viewpoint);
}

/** Whether the caller's owned business is the given business (vendor-side check). */
async function isOwnedBusiness(dbUserId: number, businessId: number) {
	const account = await db.query.vendorAccounts.findFirst({
		where: (va, { eq: is }) => is(va.userId, dbUserId),
		columns: { id: true },
	});
	if (!account) return false;
	const business = await db.query.vendorBusinesses.findFirst({
		where: and(
			eq(vendorBusinesses.id, businessId),
			eq(vendorBusinesses.vendorAccountId, account.id),
			isNull(vendorBusinesses.deletedAt),
		),
		columns: { id: true },
	});
	return business !== undefined;
}

/** The couple's bookings (owner or partner may read), most recent first. */
export async function listForWedding(
	dbUserId: number,
): Promise<BookingListSchema> {
	const weddingId = await getCoupleWeddingId(dbUserId);
	const rows = await db.query.bookings.findMany({
		where: and(eq(bookings.weddingId, weddingId), isNull(bookings.deletedAt)),
		orderBy: [desc(bookings.bookedAt), desc(bookings.id)],
		...bookingWith,
	});
	return {
		items: await Promise.all(rows.map((row) => buildBooking(row, "couple"))),
	};
}

/** The vendor's incoming booking requests, most recent first. */
export async function listRequests(
	dbUserId: number,
): Promise<BookingListSchema> {
	const { businessId } = await getOwnedBusiness(dbUserId);
	const rows = await db.query.bookings.findMany({
		where: and(
			eq(bookings.vendorBusinessId, businessId),
			isNull(bookings.deletedAt),
		),
		orderBy: [desc(bookings.bookedAt), desc(bookings.id)],
		...bookingWith,
	});
	return {
		items: await Promise.all(rows.map((row) => buildBooking(row, "vendor"))),
	};
}
