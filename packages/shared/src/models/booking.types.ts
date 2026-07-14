import { z } from "zod";
import { BookingStatusEnum } from "./wedding.types";

/**
 * A booking as one side of the handshake sees it. Booking is per vendor
 * service, so `serviceLabel` (the service's category name, or its custom label)
 * distinguishes two bookings with the same business. Like a message thread, the
 * counterparty fields are the *other* party — the couple sees the vendor
 * business (name/logo/location); the vendor sees the couple (names + wedding
 * date) — so the same row renders role-aware without the client knowing which
 * side it's on. `vendorBusinessUuid` is always the vendor (both sides need it
 * to navigate to the listing).
 */
export const BookingSchema = z.object({
	uuid: z.string().uuid(),
	status: BookingStatusEnum,
	bookedAt: z.date(),
	confirmedAt: z.date().nullable(),
	counterpartyKind: z.enum(["vendor", "couple"]),
	title: z.string(),
	subtitle: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	vendorBusinessUuid: z.string().uuid(),
	vendorServiceUuid: z.string().uuid(),
	serviceLabel: z.string().nullable(),
	weddingDate: z.date().nullable(),
	packageUuid: z.string().uuid().nullable(),
	packageName: z.string().nullable(),
	packagePriceCents: z.number().int().nullable(),
});
export type BookingSchema = z.infer<typeof BookingSchema>;

export const BookingListSchema = z.object({
	items: z.array(BookingSchema),
});
export type BookingListSchema = z.infer<typeof BookingListSchema>;

/**
 * Couples request a booking for a specific service; the package is an optional
 * refinement within that service.
 */
export const RequestBookingInputSchema = z.object({
	vendorServiceUuid: z.string().uuid(),
	servicePackageUuid: z.string().uuid().optional(),
});
export type RequestBookingInputSchema = z.infer<
	typeof RequestBookingInputSchema
>;

export const BookingUuidInputSchema = z.object({
	bookingUuid: z.string().uuid(),
});
export type BookingUuidInputSchema = z.infer<typeof BookingUuidInputSchema>;
