import { oc } from "@orpc/contract";
import {
	BookingListSchema,
	BookingSchema,
	BookingUuidInputSchema,
	RequestBookingInputSchema,
} from "@repo/shared";

export const bookingContract = {
	request: oc.input(RequestBookingInputSchema).output(BookingSchema),
	confirm: oc.input(BookingUuidInputSchema).output(BookingSchema),
	cancel: oc.input(BookingUuidInputSchema).output(BookingSchema),
	listForWedding: oc.output(BookingListSchema),
	listRequests: oc.output(BookingListSchema),
};
